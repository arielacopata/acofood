// auth.js - Sistema de autenticación simple
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUser(username);
  if (user && bcrypt.compare(password, user.hash)) {
    const token = jwt.sign({userId: user.id}, SECRET);
    res.json({token, userId: user.id});
  }
});

// api.js - Endpoints para datos nutricionales
app.get('/api/profile/:userId', authenticateToken, async (req, res) => {
  const profile = await db.getUserProfile(req.params.userId);
  res.json(profile);
});

app.post('/api/food-entry/:userId', authenticateToken, async (req, res) => {
  const entry = await db.addFoodEntry(req.params.userId, req.body);
  res.json(entry);
});