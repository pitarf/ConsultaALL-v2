import { getUsers, requireAdmin } from '@/app/actions/admin';
import UserTableClient from './UserTableClient';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const users = await getUsers();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-emerald-500 w-8 h-8" />
          Gestão de Usuários
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mt-2">Lista completa de clientes, controle de saldos e banimentos.</p>
      </div>

      <UserTableClient initialUsers={users} />
    </div>
  );
}
