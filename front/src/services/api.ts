const URL_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:3001/api';

function obterToken(): string | null {
  return localStorage.getItem('medsync_token');
}

export function limparSessao() {
  localStorage.removeItem('medsync_token');
  localStorage.removeItem('medsync_usuario');
}

async function requisicao<T>(
  metodo: string,
  caminho: string,
  corpo?: unknown,
  autenticado = true
): Promise<T> {
  const cabecalhos: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (autenticado) {
    const token = obterToken();

    if (!token) {
      throw new Error('Sessão não encontrada. Faça login novamente.');
    }

    cabecalhos['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  const dados = await resposta
    .json()
    .catch(() => ({
      sucesso: false,
      mensagem: 'Resposta inválida do servidor',
    }));

  if (resposta.status === 401 && autenticado) {
    limparSessao();
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem || `Erro ${resposta.status}`
    );
  }

  return dados as T;
}

export const api = {
  auth: {
    registrar: (
      nome: string,
      email: string,
      senha: string
    ) =>
      requisicao<{
        sucesso: boolean;
        token: string;
        usuario: any;
      }>(
        'POST',
        '/auth/registrar',
        { nome, email, senha },
        false
      ),

    login: (
      email: string,
      senha: string
    ) =>
      requisicao<{
        sucesso: boolean;
        token: string;
        usuario: any;
      }>(
        'POST',
        '/auth/login',
        { email, senha },
        false
      ),

    eu: () =>
      requisicao<{
        sucesso: boolean;
        usuario: any;
      }>(
        'GET',
        '/auth/eu'
      ),

    atualizarEu: (
      dados: {
        nome?: string;
        avatar?: string;
      }
    ) =>
      requisicao<{
        sucesso: boolean;
        usuario: any;
      }>(
        'PUT',
        '/auth/eu',
        dados
      ),

    esqueciSenha: (email: string) =>
      requisicao<{
        sucesso: boolean;
        tokenDesenvolvimento?: string;
      }>(
        'POST',
        '/auth/esqueci-senha',
        { email },
        false
      ),

    redefinirSenha: (
      token: string,
      novaSenha: string
    ) =>
      requisicao<{
        sucesso: boolean;
      }>(
        'POST',
        '/auth/redefinir-senha',
        {
          token,
          novaSenha,
        },
        false
      ),
  },

  usuarios: {
    listarTodos: () =>
      requisicao<{
        total: number;
        usuarios: any[];
      }>(
        'GET',
        '/usuarios'
      ),

    buscarPorId: (id: string) =>
      requisicao<{
        usuario: any;
      }>(
        'GET',
        `/usuarios/${id}`
      ),
  },

  medicamentos: {
    listar: () =>
      requisicao<{
        sucesso: boolean;
        dados: any[];
      }>(
        'GET',
        '/medicamentos'
      ),

    buscar: (id: string) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'GET',
        `/medicamentos/${encodeURIComponent(id)}`
      ),

    criar: (dados: any) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'POST',
        '/medicamentos',
        dados
      ),

    atualizar: (
      id: string,
      dados: any
    ) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'PUT',
        `/medicamentos/${encodeURIComponent(id)}`,
        dados
      ),

    excluir: (id: string) =>
      requisicao<{
        sucesso: boolean;
      }>(
        'DELETE',
        `/medicamentos/${encodeURIComponent(id)}`
      ),

    alternar: (id: string) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'PATCH',
        `/medicamentos/${encodeURIComponent(id)}/alternar`
      ),
  },

  registros: {
    listar: (dias?: number) =>
      requisicao<{
        sucesso: boolean;
        dados: any[];
      }>(
        'GET',
        `/registros${dias ? `?dias=${dias}` : ''}`
      ),

    hoje: () =>
      requisicao<{
        sucesso: boolean;
        dados: any[];
      }>(
        'GET',
        '/registros/hoje'
      ),

    adesao: () =>
      requisicao<{
        sucesso: boolean;
        dados: {
          dias7: number;
          dias30: number;
        };
      }>(
        'GET',
        '/registros/adesao'
      ),

    salvar: (
      medicamentoId: string,
      horarioAgendado: string,
      situacao: string,
      observacao?: string
    ) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'POST',
        '/registros',
        {
          medicamentoId,
          horarioAgendado,
          situacao,
          observacao,
        }
      ),
  },
};