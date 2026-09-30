const URL_BASE = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api'
).replace(/\/+$/, '');

function obterToken(): string | null {
  return localStorage.getItem('medsync_token');
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

    if (token) {
      cabecalhos['Authorization'] = `Bearer ${token}`;
    }
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  const dados = await resposta.json().catch(() => ({
    sucesso: false,
    mensagem: 'Resposta inválida do servidor',
  }));

  if (!resposta.ok) {
    if (resposta.status === 401) {
      localStorage.removeItem('medsync_token');
      localStorage.removeItem('medsync_usuario');
    }

    throw new Error(
      dados?.mensagem || `Erro HTTP ${resposta.status}`
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

    esqueciSenha: (
      email: string
    ) =>
      requisicao<{
        sucesso: boolean;
        mensagem: string;
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
        mensagem: string;
      }>(
        'POST',
        '/auth/redefinir-senha',
        { token, novaSenha },
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

    buscarPorId: (
      id: string
    ) =>
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

    buscar: (
      id: string
    ) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'GET',
        `/medicamentos/${id}`
      ),

    criar: (
      dados: any
    ) =>
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
        `/medicamentos/${id}`,
        dados
      ),

    excluir: (
      id: string
    ) =>
      requisicao<{
        sucesso: boolean;
        mensagem: string;
      }>(
        'DELETE',
        `/medicamentos/${id}`
      ),

    alternar: (
      id: string
    ) =>
      requisicao<{
        sucesso: boolean;
        dados: any;
      }>(
        'PATCH',
        `/medicamentos/${id}/alternar`
      ),
  },

  registros: {
    listar: (
      dias?: number
    ) =>
      requisicao<{
        sucesso: boolean;
        dados: any[];
      }>(
        'GET',
        dias
          ? `/registros?dias=${dias}`
          : '/registros'
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