import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  usuario: User | null;
  user: User | null;
  login: (email: string, senha: string) => Promise<boolean>;
  registrar: (nome: string, email: string, senha: string) => Promise<boolean>;
  sair: () => void;
  logout: () => void;
  atualizarUsuario: (dados: Partial<User>) => Promise<void>;
  updateUser: (dados: Partial<User>) => Promise<void>;
  solicitarRecuperacaoSenha: (email: string) => Promise<{ ok: boolean; tokenDesenvolvimento?: string }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; devToken?: string }>;
  redefinirSenha: (token: string, novaSenha: string) => Promise<boolean>;
  resetPassword: (token: string, novaSenha: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const CHAVE_TOKEN = 'medsync_token';
const CHAVE_SESSAO = 'medsync_sessao';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessaoSalva = localStorage.getItem(CHAVE_SESSAO);
    const tokenSalvo = localStorage.getItem(CHAVE_TOKEN);
    if (sessaoSalva && tokenSalvo) {
      try { setUsuario(JSON.parse(sessaoSalva)); } catch {}
      api.auth.eu()
        .then(res => {
          const u = { ...res.usuario, name: res.usuario.nome };
          setUsuario(u);
          localStorage.setItem(CHAVE_SESSAO, JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem(CHAVE_TOKEN);
          localStorage.removeItem(CHAVE_SESSAO);
          setUsuario(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, senha);
      const u = { ...res.usuario, name: res.usuario.nome };
      localStorage.setItem(CHAVE_TOKEN, res.token);
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(u));
      setUsuario(u);
      return true;
    } catch { return false; }
  };

  const registrar = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      const res = await api.auth.registrar(nome, email, senha);
      const u = { ...res.usuario, name: res.usuario.nome };
      localStorage.setItem(CHAVE_TOKEN, res.token);
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(u));
      setUsuario(u);
      return true;
    } catch (erro: any) {
      if (erro.message?.includes('ja esta cadastrado')) throw erro;
      return false;
    }
  };

  const sair = () => {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_SESSAO);
    setUsuario(null);
  };

  const atualizarUsuario = async (dados: Partial<User>) => {
    const res = await api.auth.atualizarEu({ nome: dados.name || (dados as any).nome, avatar: dados.avatar });
    const u = { ...res.usuario, name: res.usuario.nome };
    setUsuario(u);
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(u));
  };

  const solicitarRecuperacaoSenha = async (email: string) => {
    try {
      const res = await api.auth.esqueciSenha(email);
      return { ok: true, tokenDesenvolvimento: res.tokenDesenvolvimento };
    } catch { return { ok: false }; }
  };

  const redefinirSenha = async (token: string, novaSenha: string): Promise<boolean> => {
    try {
      await api.auth.redefinirSenha(token, novaSenha);
      return true;
    } catch { return false; }
  };

  const ctx: AuthContextType = {
    usuario,
    user: usuario,
    login,
    registrar,
    sair,
    logout: sair,
    atualizarUsuario,
    updateUser: atualizarUsuario,
    solicitarRecuperacaoSenha,
    requestPasswordReset: async (email) => {
      const r = await solicitarRecuperacaoSenha(email);
      return { ok: r.ok, devToken: r.tokenDesenvolvimento };
    },
    redefinirSenha,
    resetPassword: redefinirSenha,
    isLoading,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
