import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMed } from '../context/MedContext';
import { Page } from '../components/AppRouter';
import { useTheme } from '../context/ThemeContext';

interface Props { navigate: (p: Page) => void; }

export default function ProfilePage({ navigate }: Props) {
  const { usuario, atualizarUsuario, sair } = useAuth();
  const { medications, logs } = useMed();
  const { theme, toggleTheme, modoIdoso, toggleModo } = useTheme();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.name || '');
  const [mensagem, setMensagem] = useState('');
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [confirmarModo, setConfirmarModo] = useState(false);

  const exibirMensagem = (msg: string) => { setMensagem(msg); setTimeout(() => setMensagem(''), 3000); };

  const handleSalvar = async () => {
    if (!nome.trim()) return;
    try {
      await atualizarUsuario({ name: nome.trim() });
      setEditando(false);
      exibirMensagem('Perfil atualizado com sucesso');
    } catch {
      exibirMensagem('Erro ao atualizar perfil');
    }
  };

  const totalTomadas = logs.filter(l => l.status === 'taken').length;
  const totalPerdidas = logs.filter(l => l.status === 'missed').length;
  const medsAtivos = medications.filter(m => m.active).length;
  const adesao = logs.length ? Math.round((totalTomadas / logs.length) * 100) : 100;
  const dataIngresso = usuario?.createdAt
    ? new Date(usuario.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const exportarDados = () => {
    const dados = { usuario: { nome: usuario?.name, email: usuario?.email }, medicamentos: medications, registros: logs, exportadoEm: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medsync-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    exibirMensagem('Backup exportado');
  };

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__bg" />
        <div className="profile-hero__content">
          <div className="profile-avatar-lg">
            {usuario?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-hero__info">
            {editando ? (
              <div className="profile-edit-row">
                <input className="profile-name-input" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
                <button className="btn btn--primary btn--sm" onClick={handleSalvar}>Salvar</button>
                <button className="btn btn--ghost btn--sm" onClick={() => { setEditando(false); setNome(usuario?.name || ''); }}>Cancelar</button>
              </div>
            ) : (
              <div className="profile-name-row">
                <h1>{usuario?.name}</h1>
                <button className="btn btn--ghost btn--xs" onClick={() => setEditando(true)}>✏️</button>
              </div>
            )}
            <p className="profile-email">{usuario?.email}</p>
            {dataIngresso && <p className="profile-joined">Membro desde {dataIngresso}</p>}
          </div>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card profile-stat-card--blue">
          <strong>{medsAtivos}</strong><span>Medicamentos ativos</span>
        </div>
        <div className="profile-stat-card profile-stat-card--green">
          <strong>{totalTomadas}</strong><span>Doses tomadas</span>
        </div>
        <div className="profile-stat-card profile-stat-card--red">
          <strong>{totalPerdidas}</strong><span>Doses perdidas</span>
        </div>
        <div className="profile-stat-card profile-stat-card--purple">
          <strong>{adesao}%</strong><span>Adesão geral</span>
        </div>
      </div>

      <div className="card">
        <div className="card__header"><h2>Adesão ao tratamento</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{totalTomadas} doses tomadas de {logs.length} registros</span>
            <strong style={{ color: adesao >= 80 ? 'var(--success)' : adesao >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{adesao}%</strong>
          </div>
          <div className="stock-bar-preview__track" style={{ height: 10 }}>
            <div className="stock-bar-preview__fill" style={{
              width: `${adesao}%`,
              background: adesao >= 80 ? 'var(--success)' : adesao >= 50 ? 'var(--warning)' : 'var(--danger)'
            }} />
          </div>
          <p className="form-hint">
            {adesao >= 80 ? 'Excelente adesão. Continue assim.' : adesao >= 50 ? 'Boa adesão, mas pode melhorar.' : 'Atenção: adesão baixa. Configure lembretes.'}
          </p>
        </div>
      </div>

      <div className="profile-sections">

        {/* Modo de Acessibilidade */}
        <div className={`card card--acessibilidade ${modoIdoso ? 'card--acessibilidade-ativo' : ''}`}>
          <div className="acessibilidade-header">
            <div className="acessibilidade-icon">♿</div>
            <div className="acessibilidade-info">
              <h2 className="card-section-title">Modo de Acessibilidade</h2>
              <p>Letras maiores, botões ampliados, alto contraste e interface simplificada para maior conforto visual.</p>
            </div>
          </div>

          {modoIdoso && (
            <div className="acessibilidade-recursos">
              <div className="acessibilidade-recurso">
                <span className="acessibilidade-recurso__icone">🔤</span>
                <span>Texto 40% maior em todo o site</span>
              </div>
              <div className="acessibilidade-recurso">
                <span className="acessibilidade-recurso__icone">🖱️</span>
                <span>Botões e áreas de toque ampliadas</span>
              </div>
              <div className="acessibilidade-recurso">
                <span className="acessibilidade-recurso__icone">👁️</span>
                <span>Alto contraste e espaçamento aumentado</span>
              </div>
              <div className="acessibilidade-recurso">
                <span className="acessibilidade-recurso__icone">📋</span>
                <span>Interface simplificada e direta</span>
              </div>
            </div>
          )}

          <div className="acessibilidade-action">
            <div className="acessibilidade-status">
              <span className={`acessibilidade-dot ${modoIdoso ? 'acessibilidade-dot--ativo' : ''}`} />
              <span>{modoIdoso ? 'Ativado' : 'Desativado'}</span>
            </div>
            <button
              className={`btn ${modoIdoso ? 'btn--danger' : 'btn--primary'} btn--lg`}
              onClick={() => setConfirmarModo(true)}
            >
              {modoIdoso ? 'Desativar Acessibilidade' : 'Ativar Modo Acessibilidade'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-section-title">Conta</h2>
          <div className="profile-items">
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">📧</span>
                <div><strong>E-mail</strong><p>{usuario?.email}</p></div>
              </div>
            </div>
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">🔑</span>
                <div><strong>Senha</strong><p>Altere sua senha de acesso</p></div>
              </div>
              <button className="btn btn--outline btn--sm" onClick={() => { sair(); navigate('forgot-password'); }}>
                Alterar senha
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-section-title">Preferências</h2>
          <div className="profile-items">
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                <div>
                  <strong>Tema {theme === 'light' ? 'Escuro' : 'Claro'}</strong>
                  <p>Alternar aparência do sistema</p>
                </div>
              </div>
              <button className={`toggle ${theme === 'dark' ? 'toggle--on' : ''}`} onClick={toggleTheme}><span /></button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-section-title">Dados</h2>
          <div className="profile-items">
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">📦</span>
                <div><strong>Exportar dados</strong><p>Baixe um backup JSON de todos os seus dados</p></div>
              </div>
              <button className="btn btn--outline btn--sm" onClick={exportarDados}>Download</button>
            </div>
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">📋</span>
                <div><strong>Total de registros</strong><p>{logs.length} entradas no histórico</p></div>
              </div>
              <span className="badge badge--neutral">{medications.length} meds</span>
            </div>
          </div>
        </div>

        <div className="card card--danger">
          <h2 className="card-section-title">Sessão</h2>
          <div className="profile-items">
            <div className="profile-item">
              <div className="profile-item__left">
                <span className="profile-item__icon">🚪</span>
                <div><strong>Sair da conta</strong><p>Encerrar sessão neste dispositivo</p></div>
              </div>
              <button className="btn btn--danger btn--sm" onClick={() => setConfirmarSaida(true)}>Sair</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: confirmar modo acessibilidade */}
      {confirmarModo && (
        <div className="modal-overlay" onClick={() => setConfirmarModo(false)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{modoIdoso ? 'Desativar Acessibilidade?' : 'Ativar Modo Acessibilidade?'}</h2>
              <button className="modal__close" onClick={() => setConfirmarModo(false)}>✕</button>
            </div>
            <div className="modal__body">
              {modoIdoso ? (
                <p>O site voltará ao tamanho e aparência padrão.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p>O modo de acessibilidade deixa o site mais fácil de usar com:</p>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>Letras 40% maiores em todo o site</li>
                    <li>Botões maiores e mais fáceis de clicar</li>
                    <li>Espaçamento ampliado entre elementos</li>
                    <li>Alto contraste para melhor leitura</li>
                    <li>Interface simplificada</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setConfirmarModo(false)}>Cancelar</button>
              <button
                className={`btn ${modoIdoso ? 'btn--outline' : 'btn--primary'}`}
                onClick={() => { toggleModo(); setConfirmarModo(false); exibirMensagem(modoIdoso ? 'Modo padrão ativado' : 'Modo Acessibilidade ativado'); }}
              >
                {modoIdoso ? 'Desativar' : 'Ativar agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar saída */}
      {confirmarSaida && (
        <div className="modal-overlay" onClick={() => setConfirmarSaida(false)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Sair da conta?</h2>
              <button className="modal__close" onClick={() => setConfirmarSaida(false)}>✕</button>
            </div>
            <div className="modal__body">
              <p>Você será desconectado. Poderá entrar novamente a qualquer momento.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setConfirmarSaida(false)}>Cancelar</button>
              <button className="btn btn--danger" onClick={sair}>Confirmar saída</button>
            </div>
          </div>
        </div>
      )}

      {mensagem && <div className="toast toast--success">{mensagem}</div>}
    </div>
  );
}
