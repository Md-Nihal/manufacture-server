/*
https://github.com/programming-hero-web-course1/manufacturer-website-server-side-Md-Nihal
*/ 

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5jfa.mongodb.net/?retryWrites=true&w=majority`

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bkuu2ps.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Access Denied' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}
  
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('tata-services').collection('services');
    const bookingCollection = client.db('tata-services').collection('booking');
    const userCollection = client.db('tata-services').collection('user');
    const moreServicesCollection =client.db('tata-services').collection('moreServices')
    const ratingData= client.db('tata-services').collection('reviewData')
   
    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      // console.log(services)
      res.send(services);
    });

    app.get('/moreServices', async(req,res) =>{
      const cursor1 =moreServicesCollection.find({});
      const services2 =await cursor1.toArray();
      console.log(services2)
      res.send(services2);
  })

    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      console.log(users)
      res.send(users);
    });

    app.get('/admin/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role == 'admin';
      res.send({admin: isAdmin})
    })

    
    app.get('/reviewData',  async(req,res) =>{
      // const cursor5 =ratingData.find({});
      const services5 =await ratingData.find().toArray();
      // console.log(services5)
      res.send(services5);
  })

    
    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role !== 'admin') {
        res.status(403).send({message: 'forbidden'})
    
      }
      else{
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };

        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
       
      }
    })
      
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      
      res.send( { result, token });
    })

    app.get('/available', verifyJWT, async (req, res) => {
      const quantity = req.query.quantity;
      const services = await serviceCollection.find().toArray(); 
      const query = { quantity: quantity };
      const bookings = await bookingCollection.find(query).toArray();
      services.forEach(service => {  
        const serviceBookings = bookings.filter(book => book.treatment === service.name);;
        const bookedQuantity = serviceBookings.map(book => book.quantity);
        const available = service.quantity.find(quantity => !bookedQuantity.includes(quantity));
        service.quantity = available;
      });
      res.send(services);
    })

    app.get('/booking' , verifyJWT , async(req, res) =>{
      const customer = req.query.customer;
      const decodedEmail = req.decoded.email;
      if (customer=== decodedEmail){
      const query = {customer: customer};
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);}
      else{
        return res.status(403).send({ message: 'forbidden access' });
      }
    })

    
    app.post('/reviewData', async(req,res)=>{
      const service4 =req.body;
      console.log('hit the post',service4)
      const result = await ratingData.insertOne(service4);
      // console.log(result);
      res.json(result)
  });

    app.post('/booking', async (req, res) => {
      const booking = req.body
      // console.log(booking,req.body)
      const query = { treatment: booking.treatment, quantity:booking.quantity, customer: booking.customer }
      // console.log(query)
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingCollection.insertOne(booking);
      // console.log(result)
      return res.send({ success: true, result });
    })

    app.delete('/user/_id', verifyJWT,  async (req, res) => {
      const _id = req.params._id;
      const filter = { id: _id};
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    })

    app.delete('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id:(id)};
      // console.log(query)
      result =await serviceCollection.deleteOne(query);
      res.json(result);
      console.log(result)

  })

  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello From Tata motors!')
})

app.listen(port, () => {
  console.log(`Tata motors listening in port ${port}`)
})