import { createClient } from '@supabase/supabase-client';

const supabaseUrl = 'https://mddbbwbwmwcvecbnfmqg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupSuperAdmin() {
  const email = 'superadmin@cliniplus.com';
  const password = 'superpassword';

  console.log(`Verificando se o usuário ${email} já existe...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
    return;
  }

  let existingUser = users.find(u => u.email === email);
  let userId;

  if (existingUser) {
    console.log(`Usuário já existe no Auth. ID: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    console.log('Criando novo usuário no Auth...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome_completo: 'Super Admin Sistema' }
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError.message);
      return;
    }
    userId = userData.user.id;
    console.log(`Usuário criado com sucesso. ID: ${userId}`);
  }

  // Criar ou atualizar o profile com role superadmin
  console.log('Configurando profile de superadmin...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nome_completo: 'Super Admin Sistema',
      email: 'superadmin@cliniplus.com',
      role: 'superadmin',
      clinica_id: null
    });

  if (profileError) {
    console.error('Erro ao atualizar profile:', profileError.message);
  } else {
    console.log('### CONCLUÍDO COM SUCESSO! ###');
    console.log('Login: superadmin@cliniplus.com');
    console.log('Senha: superpassword');
  }
}

setupSuperAdmin();
