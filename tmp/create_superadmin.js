const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://mddbbwbwmwcvecbnfmqg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupSuperAdmin() {
  const email = 'superadmin@cliniplus.com';
  const password = 'superpassword';

  console.log(`Verificando se o usuário ${email} já existe...`);

  // 1. Tentar criar o usuário no Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome_completo: 'Super Admin Sistema' }
  });

  if (userError) {
    if (userError.message.includes('already registered')) {
      console.log('Usuário já existe no Auth. Buscando ID...');
      const { data: listUsers } = await supabase.auth.admin.listUsers();
      const existingUser = listUsers.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`ID encontrado: ${existingUser.id}. Atualizando profile...`);
        updateProfile(existingUser.id);
      }
    } else {
      console.error('Erro ao criar usuário:', userError.message);
    }
    return;
  }

  console.log(`Usuário criado com sucesso. ID: ${userData.user.id}`);
  updateProfile(userData.user.id);
}

async function updateProfile(userId) {
  // 2. Criar ou atualizar o profile com role superadmin
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      nome_completo: 'Super Admin Sistema',
      email: 'superadmin@cliniplus.com',
      role: 'superadmin',
      clinica_id: null // Superadmin global
    });

  if (profileError) {
    console.error('Erro ao atualizar profile:', profileError.message);
  } else {
    console.log('Profile de SuperAdmin configurado com sucesso! Use a senha: superpassword');
  }
}

setupSuperAdmin();
