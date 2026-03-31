const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/api/register', (req, res) => {
  const { firstName, lastName, username, email, password, month, day, year } = req.body;

  console.log('New user registration received:');
  console.log({
    firstName,
    lastName,
    username,
    email,
    password,
    month,
    day,
    year
  });

  res.status(200).json({
    message: 'Registration successful (mock API)'
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});


