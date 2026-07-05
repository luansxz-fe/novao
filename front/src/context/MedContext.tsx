import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface MedContextType {
  medications: Medication[];
  logs: MedicationLog[];
  loading: boolean;
  addMedication: (med: Omit<Medication, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateMedication: (id: string, dados: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  logDose: (medicamentoId: string, horario: string, situacao: MedicationLog['status'], observacao?: string) => Promise<void>;
  getTodayLogs: () => MedicationLog[];
  getAdherenceRate: (dias?: number) => number;
  getTodayMedications: () => { medication: Medication; log?: MedicationLog; scheduledTime: string }[];
  getUpcomingDoses: () => { medication: Medication; time: string }[];
  refresh: () => Promise<void>;
}

const MedContext = createContext<MedContextType>({} as MedContextType);

const MAPA_SITUACAO: Record<string, string> = {
  tomada: 'taken', perdida: 'missed', pulada: 'skipped', pendente: 'pending',
};
const MAPA_STATUS: Record<string, string> = {
  taken: 'tomada', missed: 'perdida', skipped: 'pulada', pending: 'pendente',
};

function converterMedicamento(d: any): Medication {
  return {
    id: String(d.id),
    userId: String(d.usuarioId),
    name: d.nome,
    dosage: d.dosagem,
    unit: d.unidade,
    frequency: d.frequencia,
    times: d.horarios || [],
    startDate: d.dataInicio,
    endDate: d.dataTermino || undefined,
    instructions: d.instrucoes || undefined,
    color: d.cor,
    icon: d.icone,
    category: d.categoria,
    stock: d.estoqueAtual,
    stockMax: d.estoqueMaximo,
    reminderEnabled: d.lembreteAtivo,
    active: d.ativo,
    imageUrl: d.urlImagem || undefined,
    prescribedBy: d.medicoPrescritor || undefined,
    sideEffects: d.efeitosColaterais || undefined,
    createdAt: d.criadoEm,
  };
}

function converterRegistro(d: any): MedicationLog {
  return {
    id: String(d.id),
    medicationId: String(d.medicamentoId),
    userId: String(d.usuarioId),
    scheduledTime: d.horarioAgendado,
    takenAt: d.tomadoEm || undefined,
    status: (MAPA_SITUACAO[d.situacao] || d.situacao) as MedicationLog['status'],
    date: d.dataDose,
    notes: d.observacao || undefined,
  };
}

function converterParaEnvio(med: Omit<Medication, 'id' | 'userId' | 'createdAt'>): any {
  return {
    nome: med.name,
    dosagem: med.dosage,
    unidade: med.unit,
    frequencia: med.frequency,
    horarios: med.times,
    dataInicio: med.startDate,
    dataTermino: med.endDate || null,
    instrucoes: med.instructions || null,
    cor: med.color,
    icone: med.icon,
    categoria: med.category,
    estoqueAtual: med.stock,
    estoqueMaximo: med.stockMax,
    lembreteAtivo: med.reminderEnabled,
    ativo: med.active,
    urlImagem: med.imageUrl || null,
    medicoPrescritor: med.prescribedBy || null,
    efeitosColaterais: med.sideEffects || null,
  };
}

export function MedProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarTudo = useCallback(async () => {
    if (!usuario) { setMedications([]); setLogs([]); return; }
    setLoading(true);
    try {
      const [resMeds, resLogs] = await Promise.all([
        api.medicamentos.listar(),
        api.registros.listar(),
      ]);
      setMedications((resMeds.dados || []).map(converterMedicamento));
      setLogs((resLogs.dados || []).map(converterRegistro));
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => { buscarTudo(); }, [buscarTudo]);

  const addMedication = async (med: Omit<Medication, 'id' | 'userId' | 'createdAt'>) => {
    const res = await api.medicamentos.criar(converterParaEnvio(med));
    setMedications(prev => [converterMedicamento(res.dados), ...prev]);
  };

  const updateMedication = async (id: string, dados: Partial<Medication>) => {
    const res = await api.medicamentos.atualizar(Number(id), converterParaEnvio(dados as any));
    setMedications(prev => prev.map(m => m.id === id ? converterMedicamento(res.dados) : m));
  };

  const deleteMedication = async (id: string) => {
    await api.medicamentos.excluir(Number(id));
    setMedications(prev => prev.filter(m => m.id !== id));
    setLogs(prev => prev.filter(l => l.medicationId !== id));
  };

  const logDose = async (medicamentoId: string, horario: string, status: MedicationLog['status'], observacao?: string) => {
    const situacao = MAPA_STATUS[status] || status;
    const res = await api.registros.salvar(Number(medicamentoId), horario, situacao, observacao);
    const novoLog = converterRegistro(res.dados);
    setLogs(prev => {
      const idx = prev.findIndex(l => l.medicationId === medicamentoId && l.scheduledTime === horario && l.date === novoLog.date);
      return idx >= 0 ? prev.map((l, i) => i === idx ? novoLog : l) : [...prev, novoLog];
    });
  };

  const getTodayLogs = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return logs.filter(l => l.date === hoje);
  };

  const getAdherenceRate = (dias = 7) => {
    const corte = new Date(); corte.setDate(corte.getDate() - dias);
    const recentes = logs.filter(l => new Date(l.date) >= corte);
    if (!recentes.length) return 100;
    return Math.round((recentes.filter(l => l.status === 'taken').length / recentes.length) * 100);
  };

  const getTodayMedications = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const logsHoje = logs.filter(l => l.date === hoje);
    const resultado: { medication: Medication; log?: MedicationLog; scheduledTime: string }[] = [];
    medications.filter(m => m.active).forEach(med => {
      med.times.forEach(horario => {
        const log = logsHoje.find(l => l.medicationId === med.id && l.scheduledTime === horario);
        resultado.push({ medication: med, log, scheduledTime: horario });
      });
    });
    return resultado.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, logs]);

  const getUpcomingDoses = useCallback(() => {
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    const hoje = agora.toISOString().split('T')[0];
    const logsHoje = logs.filter(l => l.date === hoje);
    const resultado: { medication: Medication; time: string }[] = [];
    medications.filter(m => m.active).forEach(med => {
      med.times.forEach(horario => {
        if (horario > horaAtual && !logsHoje.find(l => l.medicationId === med.id && l.scheduledTime === horario)) {
          resultado.push({ medication: med, time: horario });
        }
      });
    });
    return resultado.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);
  }, [medications, logs]);

  return (
    <MedContext.Provider value={{
      medications, logs, loading,
      addMedication, updateMedication, deleteMedication, logDose,
      getTodayLogs, getAdherenceRate, getTodayMedications, getUpcomingDoses,
      refresh: buscarTudo,
    }}>
      {children}
    </MedContext.Provider>
  );
}

export const useMed = () => useContext(MedContext);
