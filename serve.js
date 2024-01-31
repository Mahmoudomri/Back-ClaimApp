const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(session({
  secret: '94513310Omri', // Change this to a secure key
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
// Connect to MongoDB (replace 'your-mongodb-uri' with your MongoDB connection string)
mongoose.connect('mongodb+srv://ClaimBank:94513310Omri@cluster0.bpejgvz.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Define a MongoDB model for claims
const Claim = mongoose.model('Claim', {
  accountNumber: String,
  claimAmount: Number,
  reason: String,
});
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', UserSchema);
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// Create a route to handle claim submissions

app.post('/api/register', async (req, res) => {
  try {
    // Register a new user
    const newUser = new User({ username: req.body.username });
    await User.register(newUser, req.body.password);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Login successful' });
});

app.post('/api/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logout successful' });
});
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/claims', async (req, res) => {
  try {
    const newClaim = new Claim(req.body);
    await newClaim.save();
    res.status(201).json({ message: 'Claim submitted successfully' });
  } catch (error) {
    console.error('Error submitting claim: ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/claims', async (req, res) => {
  try {
    const claims = await Claim.find();
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error getting claims:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/claims/:id', async(req,res)=>{
  try {
    const deletedClaim=await Claim.findByIdAndDelete(req.params.id)
    if (!deletedClaim){
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.status(200).json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.put('/api/claims/:id',async(req,res)=>{
  const claimId = req.params.id;
  
  try {
    // Find the claim by ID and update its data
    const updatedClaim = await Claim.findByIdAndUpdate(claimId, req.body, { new: true });

    if (!updatedClaim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.status(200).json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
