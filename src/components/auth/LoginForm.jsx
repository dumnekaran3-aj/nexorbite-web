
//LoginFrom.jsx

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post('/auth/signin', { email, password });
    localStorage.setItem('token', res.data.token); // Token save karein
    localStorage.setItem('user', JSON.stringify(res.data.user));
    // Redirect to home/dashboard
  } catch (err) {
    alert(err.response?.data?.message || "Login Failed");
  }
};



