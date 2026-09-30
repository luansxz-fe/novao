import React, { createContext, useState, useEffect } from 'react';
import { Medication, DoseLog, TodayMedicationItem } from '../types';
import { api } from '../services/api';

export interface MedContextData {
  medications: Medication[];
  logs: DoseLog[];
  adherence: { dias7: number; dias30: number };
  addMedication: (data: Omit<Medication, 'id'> & { id?: string; _id?: string }) => Promise<void>;
  updateMedication: (id: string, data: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  logDose: (medicationId: string, time: string, status: string, notes?: string) => Promise<void>;
  getTodayMedications: () => TodayMedicationItem[];
  getUpcomingDoses: () => { medication: Medication; time: string }[];
  getAdherenceRate: (days: number) => number;
  fetchMedications: () => Promise<void>;
  fetchAdherence: () => Promise<void>;
}

export const MedContext = createContext<MedContextData>({} as MedContextData);

const STORAGE_KEY_MEDS = '@medapp:medications_cache';
const STORAGE_KEY_LOGS = '@medapp:logs_cache';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (d?: any): string => {
  if (!d) return getTodayString();
  const str = String(d).trim();
  if (str.includes('T')) return str.split('T')[0];
  return str.slice(0, 10);
};

const normalizeTime = (t?: any): string => {
  if (!t) return '';
  return String(t).trim().slice(0, 5);
};

const isTimePassed = (timeStr: string) => {
  const normalized = normalizeTime(timeStr);
  if (!normalized) return false;
  const [h, m] = normalized.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = h * 60 + m;
  return currentMinutes > scheduledMinutes;
};

export const MedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<DoseLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adherence, setAdherence] = useState<{ dias7: number; dias30: number }>({ dias7: 100, dias30: 100 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }, [logs]);

  const formatMed = (item: any): Medication => {
    const realId = String(item.id || item._id || Date.now()).trim();
    return {
      id: realId,
      _id: realId,
      name: item.nome || item.name || '',
      dosage: item.dosagem || item.dosage || '',
      unit: item.unidade || item.unit || 'mg',
      frequency: item.frequencia || item.frequency || 'Diário',
      times: item.horarios || item.times || [],
      stock: Number(item.estoqueAtual ?? item.estoque ?? item.stock ?? 0),
      stockMax: Number(item.estoqueMaximo ?? item.stockMax ?? 30),
      active: item.ativo ?? item.active ?? true,
      color: item.cor || item.color || '#3b82f6',
      category: item.categoria || item.category || 'Geral',
      icon: item.icone || item.icon || 'Pill',
      imageUrl: item.urlImagem || item.imageUrl || item.imagemUrl,
      prescribedBy: item.medicoPrescritor || item.medico || item.prescribedBy,
      startDate: item.dataInicio || item.startDate || getTodayString(),
      endDate: item.dataTermino || item.endDate,
      reminderEnabled: item.lembreteAtivo ?? item.reminderEnabled ?? true,
      instructions: item.instrucoes || item.instructions,
      sideEffects: item.efeitosColaterais || item.sideEffects,
    };
  };

  const parseLog = (l: any): DoseLog => {
    const rawStatus = String(l.situacao || l.status || '').toUpperCase().trim();
    const isTaken = ['TOMADO', 'TAKEN', 'CONCLUIDO', 'OK', 'TRUE'].includes(rawStatus);
    const isMissed = ['PERDIDO', 'MISSED', 'ATRASADO'].includes(rawStatus);

    const frontendStatus: 'taken' | 'skipped' | 'missed' = isTaken ? 'taken' : isMissed ? 'missed' : 'skipped';
    const backendStatus = isTaken ? 'TOMADO' : isMissed ? 'PERDIDO' : 'PULADO';

    const medId = String(
      l.medicamentoId || 
      l.medicationId || 
      (typeof l.medicamento === 'object' ? (l.medicamento?.id || l.medicamento?._id) : l.medicamento) || 
      ''
    ).trim();

    return {
      id: String(l.id || l._id || Date.now()).trim(),
      _id: String(l._id || l.id || Date.now()).trim(),
      medicationId: medId,
      scheduledTime: normalizeTime(l.horarioAgendado || l.scheduledTime || l.horario),
      status: frontendStatus,
      situacao: backendStatus,
      date: normalizeDate(l.data || l.date || l.criadoEm || l.createdAt),
      notes: l.observacao || l.notes
    };
  };

  // Mapeia corretamente os campos exigidos pela validação do Backend
  const parseToApiPayload = (med: any) => {
    return {
      nome: med.name || med.nome,
      dosagem: med.dosage || med.dosagem,
      unidade: med.unit || med.unidade || 'mg',
      frequencia: med.frequency || med.frequencia || 'Diário',
      horarios: med.times || med.horarios || [],
      dataInicio: med.startDate || med.dataInicio || getTodayString(),
      dataTermino: med.endDate || med.dataTermino || null,
      cor: med.color || med.cor || '#3b82f6',
      icone: med.icon || med.icone || 'Pill',
      categoria: med.category || med.categoria || 'Geral',
      estoqueAtual: Number(med.stock ?? med.estoqueAtual ?? med.estoque ?? 0),
      estoqueMaximo: Number(med.stockMax ?? med.estoqueMaximo ?? 30),
      lembreteAtivo: med.reminderEnabled ?? med.lembreteAtivo ?? true,
      ativo: med.active ?? med.ativo ?? true,
      urlImagem: med.imageUrl || med.urlImagem || null,
      medicoPrescritor: med.prescribedBy || med.medicoPrescritor || med.medico || null,
      instrucoes: med.instructions || med.instrucoes || null,
      efeitosColaterais: med.sideEffects || med.efeitosColaterais || null,
    };
  };

  const fetchAdherence = async () => {
    try {
      const res = await api.registros.adesao();
      if (res?.dados) {
        setAdherence({
          dias7: Number(res.dados.dias7 ?? 0),
          dias30: Number(res.dados.dias30 ?? 0)
        });
      }
    } catch (error) {
      console.error('Erro ao buscar taxa de adesão:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const [medsRes, logsRes] = await Promise.all([
        api.medicamentos.listar().catch(() => null),
        api.registros.listar().catch(() => null)
      ]);

      // Atualiza o estado SEMPRE que a resposta for um array (mesmo se vazio), para não manter cache de outro utilizador
      if (medsRes?.dados && Array.isArray(medsRes.dados)) {
        const formatados = medsRes.dados.map(formatMed);
        setMedications(formatados);
        localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(formatados));
      }

      if (logsRes?.dados && Array.isArray(logsRes.dados)) {
        const logsFormatados = logsRes.dados.map(parseLog);
        setLogs(logsFormatados);
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logsFormatados));
      }

      await fetchAdherence();
    } catch (error) {
      console.error('Erro ao carregar dados da API:', error);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const addMedication = async (medData: Omit<Medication, 'id'> & { id?: string; _id?: string }) => {
    const payload = parseToApiPayload(medData);

    try {
      const res = await api.medicamentos.criar(payload);
      if (res?.dados) {
        const novoMed = formatMed(res.dados);
        setMedications(prev => [...prev, novoMed]);
      }
    } catch (error) {
      console.error('Erro ao criar medicamento na API:', error);
      throw error;
    }
  };

  const updateMedication = async (id: string, data: Partial<Medication>) => {
    if (!id) return;

    try {
      const targetId = !isNaN(Number(id)) ? Number(id) : id;
      const res = await api.medicamentos.atualizar(targetId, parseToApiPayload(data));
      if (res?.dados) {
        const medAtualizado = formatMed(res.dados);
        setMedications(prev => prev.map(m => (String(m.id) === String(id) || String(m._id) === String(id)) ? medAtualizado : m));
      }
    } catch (error) {
      console.error('Erro ao atualizar medicamento na API:', error);
    }
  };

  const deleteMedication = async (id: string) => {
    if (!id) return;

    try {
      const targetId = !isNaN(Number(id)) ? Number(id) : id;
      await api.medicamentos.excluir(targetId);
      setMedications(prev => prev.filter(m => String(m.id) !== String(id) && String(m._id) !== String(id)));
    } catch (error) {
      console.error('Erro ao eliminar medicamento na API:', error);
    }
  };

  const logDose = async (medicationId: string, time: string, status: string, notes?: string) => {
    const todayStr = getTodayString();
    const cleanTime = normalizeTime(time);
    const cleanMedId = String(medicationId).trim();
    
    const rawStatus = String(status).trim().toLowerCase();
    const isTaken = ['taken', 'tomado', 'concluido', 'ok', 'true'].includes(rawStatus);
    const isMissed = ['missed', 'perdido', 'atrasado'].includes(rawStatus);

    const frontendStatus: 'taken' | 'skipped' | 'missed' = isTaken ? 'taken' : isMissed ? 'missed' : 'skipped';
    const backendStatus = isTaken ? 'TOMADO' : isMissed ? 'PERDIDO' : 'PULADO';

    const existingLog = logs.find(l => 
      String(l.medicationId).trim() === cleanMedId &&
      normalizeTime(l.scheduledTime) === cleanTime &&
      normalizeDate(l.date) === todayStr
    );

    const wasTakenBefore = existingLog?.status === 'taken' || existingLog?.situacao === 'TOMADO';

    const newLog: DoseLog = {
      id: String(Date.now()),
      _id: String(Date.now()),
      medicationId: cleanMedId,
      scheduledTime: cleanTime,
      status: frontendStatus,
      situacao: backendStatus,
      date: todayStr,
      notes
    };

    setLogs(prev => [
      newLog,
      ...prev.filter(l => !(
        String(l.medicationId).trim() === cleanMedId &&
        normalizeTime(l.scheduledTime) === cleanTime &&
        normalizeDate(l.date) === todayStr
      ))
    ]);

    if (isTaken && !wasTakenBefore) {
      setMedications(prev => prev.map(m => {
        if (String(m.id).trim() === cleanMedId || String(m._id).trim() === cleanMedId) {
          const newStock = Math.max(0, (m.stock ?? 1) - 1);
          const targetId = !isNaN(Number(cleanMedId)) ? Number(cleanMedId) : cleanMedId;
          api.medicamentos.atualizar(targetId, parseToApiPayload({ ...m, stock: newStock })).catch(() => {});
          return { ...m, stock: newStock };
        }
        return m;
      }));
    }

    try {
      const targetMedId = !isNaN(Number(cleanMedId)) ? Number(cleanMedId) : cleanMedId;
      const res = await api.registros.salvar(targetMedId, cleanTime, backendStatus, notes);

      if (res?.dados) {
        const parsedServerLog = parseLog(res.dados);
        setLogs(prev => prev.map(l => l.id === newLog.id ? parsedServerLog : l));
      }

      await fetchAdherence();
    } catch (error) {
      console.error('Erro ao salvar registro na API:', error);
    }
  };

  useEffect(() => {
    if (medications.length === 0) return;

    const checkMissedDoses = () => {
      const todayStr = getTodayString();

      medications.filter(m => m.active).forEach(med => {
        (med.times || []).forEach(time => {
          const cleanTime = normalizeTime(time);
          const medId = String(med.id || med._id).trim();

          const hasLog = logs.some(l => 
            String(l.medicationId).trim() === medId &&
            normalizeTime(l.scheduledTime) === cleanTime &&
            normalizeDate(l.date) === todayStr
          );

          if (!hasLog && isTimePassed(cleanTime)) {
            logDose(medId, cleanTime, 'missed');
          }
        });
      });
    };

    checkMissedDoses();
    const interval = setInterval(checkMissedDoses, 30000);
    return () => clearInterval(interval);
  }, [medications, logs]);

  const getTodayMedications = (): TodayMedicationItem[] => {
    const todayStr = getTodayString();
    const items: TodayMedicationItem[] = [];

    medications.filter(m => m.active).forEach(med => {
      (med.times || []).forEach(time => {
        const cleanTime = normalizeTime(time);
        const medId = String(med.id || med._id).trim();

        const log = logs.find(l => {
          const matchMed = String(l.medicationId).trim() === medId;
          const matchTime = normalizeTime(l.scheduledTime) === cleanTime;
          const matchDate = normalizeDate(l.date) === todayStr;
          return matchMed && matchTime && matchDate;
        });

        items.push({ medication: med, scheduledTime: cleanTime, log });
      });
    });

    return items;
  };

  const getUpcomingDoses = (): { medication: Medication; time: string }[] => {
    const todayMeds = getTodayMedications();
    return todayMeds
      .filter(item => !item.log && !isTimePassed(item.scheduledTime))
      .map(item => ({ medication: item.medication, time: item.scheduledTime }));
  };

  const getAdherenceRate = (days: number): number => {
    if (logs.length === 0) return 100;

    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - days);

    const recentLogs = logs.filter(l => {
      const logDate = new Date(l.date);
      return logDate >= limitDate;
    });

    const targetLogs = recentLogs.length > 0 ? recentLogs : logs;
    const tomadas = targetLogs.filter(l => l.status === 'taken' || l.situacao === 'TOMADO').length;

    return Math.round((tomadas / targetLogs.length) * 100);
  };

  return (
    <MedContext.Provider value={{
      medications,
      logs,
      adherence,
      addMedication,
      updateMedication,
      deleteMedication,
      logDose,
      getTodayMedications,
      getUpcomingDoses,
      getAdherenceRate,
      fetchMedications,
      fetchAdherence
    }}>
      {children}
    </MedContext.Provider>
  );
};

export { useMed } from './useMed';