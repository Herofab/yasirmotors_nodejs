// Import required modules
const mongoose = require('mongoose');
const multer = require('multer');
const express = require("express");
const routes = require('./routes/routes');
const Cars = require('./model/cars');
const User = require('./model/users');
const path = require('path');
const fs = require('fs');
const Order = require('./model/orders');
const shortid = require('shortid');
const session = require('express-session');
const { Guest, Notification } = require('./model/guests');
const cookieParser = require('cookie-parser');
const Schema = mongoose.Schema;

// Define the generateUniqueId function
async function generateUniqueId() {
  let id;
  let order;

  do {
    id = shortid.generate().substring(0, 6);
    order = await Order.findOne({ shortId: id });
  } while (order);

  return id;
}

// Use it like this:
async function createOrder() {
  const id = await generateUniqueId();
  const order = new Order({
    shortId: id,
    // ... other fields ...
  });
  await order.save();
}

// Somewhere in your code, you would call createOrder when you need to create a new order
createOrder();
  // Initialize Express appconst mongoose = require('mongconst upload = multer({ storage: storage });oose');
  const app = express();
  app.use(cookieParser());
  
  // Middleware for serving static files
  app.use(express.static('public'));
  
  // Middleware for parsing request body
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Set view engine to EJS
  app.set("view engine", "ejs");
  
  // Connect to MongoDB
  const DB= 'mongodb+srv://yasirmotors:yasirmotors@cluster0.jzup1qb.mongodb.net/yasirmotors';
  mongoose.connect(DB)
      .then(() => console.log('database connected'))
      .catch((err) => console.log('error coming while connecting database'));
  
  
  //sessions
  app.use(session({
      secret: 'umeramin1821644',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Note: secure should be set to true when in production and using HTTPS
    }));
  
  // Set views directory
  app.set('views', path.join(__dirname, 'views'));
  
  // Use routes
  app.use('/', routes);
  
  // User registration route
  app.post('/register', (req, res) => {
      const user = new User(req.body);
      user.save()
        .then(() => {
          // If registration is successful, redirect to the intended page or to the login page
          res.redirect('/');
        })
        .catch(err => res.status(500).send('An error occurred: ' + err.message));
    });
  
  // Admin registration route
  app.post('/admin-register', (req, res) => {
      const user = new User({
          ...req.body,
          role: 'admin'
      });
      user.save()
          .then(() => res.redirect('/login'))
          .catch(err => res.status(500).send('An error occurred: ' + err.message));
  });
  app.post('/operator-register', async (req, res) => { const guestData = req.body; guestData.role = 'operator'; 
  const guest = new Guest(guestData); 
  await guest.save(); 
  const notification = new Notification({ guestId: guest._id, message: `${guest.username} has requested to register.`, status: 'pending' });
   await notification.save();
    res.send('Registration request sent'); });
  
  app.post('/accept-registration/:notificationId', async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);
    const guest = await Guest.findById(notification.guestId);
  
    const existingUser = await User.findOne({ email: guest.email });
    if (existingUser) {
      res.status(400).send('A user with this email already exists');
      return;
    }
  
    const guestData = guest.toObject();
    const user = new User(guestData);
    await user.save();
  
    notification.status = 'accepted';
    await notification.save();
  
    res.send('Registration accepted');
  });
  
  // Reject registration route
  app.post('/reject-registration/:notificationId', async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);
    notification.status = 'rejected';
    await notification.save();
  
    res.send('Registration rejected');
  });

  app.post('/guest-register', async (req, res) => { const guestData = req.body; guestData.role = 'guest'; 
  const guest = new Guest(guestData); 
  await guest.save(); 
  const notification = new Notification({ guestId: guest._id, message: `${guest.username} has requested to register.`, status: 'pending' });
   await notification.save();
    res.send('Registration request sent'); });
  app.post('/accept-registration/:notificationId', async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);
    const guest = await Guest.findById(notification.guestId);
  
    const existingUser = await User.findOne({ email: guest.email });
    if (existingUser) {
      res.status(400).send('A user with this email already exists');
      return;
    }
  
    const guestData = guest.toObject();
    const user = new User(guestData);
    await user.save();
  
    notification.status = 'accepted';
    await notification.save();
    res.send('Registration accepted');
  });
  
  // Reject registration route
  app.post('/reject-registration/:notificationId', async (req, res) => {
    const notification = await Notification.findById(req.params.notificationId);
    notification.status = 'rejected';
    await notification.save();
  
    res.send('Registration rejected');
  });

  //User login route
  app.post('/login', (req, res) => {
      const { username, password } = req.body;
    
      User.findOne({ username })
        .then(user => {
          if (!user) {
            res.status(400).send('Username not found');
          } else if (password !== user.password) {
            res.status(400).send('Incorrect password');
          } else {
            // Store user information in the session
            req.session.user = user;
            if (user.role === 'admin') {
              res.render('admin');
            } else if (user.role === 'guest') {
              res.render('admin');
            } else if (user.role === 'operator') {
              res.render('admin');
            } 
            else {
              const redirectUrl = req.session.intendedUrl || '/';
              delete req.session.intendedUrl;
              res.redirect(redirectUrl);
            }
          }
        })
        .catch(err => res.status(500).send('An error occurred'));
    });
  app.get('/logout', function(req, res){
      if (req.session) {
          // delete session object
          req.session.destroy(function(err) {
              if(err) {
                  return next(err);
              } else {
                  return res.redirect('/');
              }
          });
      }
  });
  
  // Admin middleware
  // Admin middleware
  function isAdmin(req, res, next) {
      console.log('Session user in isAdmin:', req.session.user); // Add this line
      if (req.session.user) {
        console.log('User role:', req.session.user.role); // Add this line
        if (req.session.user.role === 'admin'|| req.session.user.role === 'operator' || req.session.user.role === 'guest' ) {
          next();
        } else {
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
  }
   // Guest middleware
  function isGuest(req, res, next) {
      if (req.session.user && req.session.user.role === 'guest') {
          next();
      } else {
          res.redirect('/login');
      }
  }
  
  // app.get("/adminsystem/dashboard", isAdmin, (req, res) =>
  
  // res.render("adminsystem/dashboard", { user: req.session.user }));
  
  app.get('/adminsystem/dashboard', async (req, res) => {
    const notifications = await Notification.find({ status: 'pending' });
    const users = await User.find({});
    res.render('adminsystem/dashboard', { notifications, users, user: req.session.user || {} });
  });
  
  // Admin route
  app.get('/admin', isAdmin, async (req, res) => {
      try {
          const newarrivals = await Newarrival.find({});
          res.render('admin', { newarrivals: newarrivals, user: req.session.user });
          
      } catch (err) {
          console.log(err);
          res.status(500).send('An error occurred: ' + err.message);
      }
  });
  
  
  //delete the data of users code
  app.post('/update-role/:userId', async (req, res) => {
    const userId = req.params.userId;
    const newRole = req.body.role;
    await User.updateOne({ _id: userId }, { role: newRole });
    res.send('Role updated');
  });
  //delete the data of users code
  app.post('/delete-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    await User.deleteOne({ _id: userId });
    res.send('User deleted');
  });

  
  
  // Home route
  app.get("/", function (req, res) {
    const directoryPath = path.join(__dirname, 'public/uploads');
    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        console.error('Unable to scan directory: ' + err);
        res.status(500).send('Server error: Unable to scan directory for images.');
        return;
      }
  
      Cars.find({}).then(cars => {
        // Filter out cars that do not have an image in the uploads directory
        const filteredCars = cars.filter(car => 
          car.image && files.includes(car.image.replace('/public/uploads/', ''))
        );
        // Render the index.ejs template with the filtered cars data
        res.render("index", { newarrivals: filteredCars });
      }).catch(err => {
        console.error('Database error: ' + err);
        res.status(500).send('Server error: Unable to retrieve cars from the database.');
      });
    });
  });

  app.get("/adminsystem/newcars", isAdmin, function (req, res){
    const directoryPath = path.join(__dirname, 'public/uploads');
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        Cars.find({}).then(cars => {
            cars = cars.map(car => {
                const imageExists = car.image && files.includes(car.image.replace('/public/uploads/', ''));
                const productCodeExists = !!car.engine_number;
                return {
                    ...car._doc,
                    imageExists,
                    productCodeExists
                };
            });
            res.render("adminsystem/newcars", {cars: cars, user: req.session.user}); // Make sure to pass the cars array here
        }).catch(err => console.log(err));
    });
});
// Edit data page route
app.get("/adminsystem/editarrivaldata/:id", isAdmin, async (req, res) => {
  try {
      const car = await Cars.findById(req.params.id);
      res.render("adminsystem/editarrivaldata", { newarrivals: car });
  } catch (err) {
      console.log(err);
      res.status(500).send('An error occurred: ' + err.message);
  }
});

// Delete data from dashboard
app.post('/delete/:id', isAdmin, async (req, res) => {
  try {
      await Cars.findByIdAndDelete(req.params.id);
      res.redirect('/adminsystem/newcars');
  } catch (err) {
      res.status(500).send('An error occurred: ' + err.message);
  }
});

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './public/uploads/');
  },
  filename: function(req, file, cb) {
      // Replace spaces with underscores in the filename
      const newFilename = file.originalname.replace(/\s/g, '_');
      cb(null, Date.now() + '-' + newFilename);
  }
});
const upload = multer({ storage: storage });

app.post("/edit/:id", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
  try {
      let updateData = req.body;
      if (req.files.image) {
          updateData.image = '/public/uploads/' + req.files.image[0].filename;
      } else {
          delete updateData.image;
      }
      if (req.files.images) {
          updateData.images = req.files.images.map(file => '/public/uploads/' + file.filename);
      } else {
          delete updateData.images;
      }
      await Cars.updateOne({ _id: req.params.id }, updateData);
      res.redirect('/adminsystem/newcars');
  } catch (err) {
      console.log(err);
      res.status(500).send('An error occurred: ' + err.message);
  }
});

  app.get('/admin/adminregister', (req, res) => {
    res.render('admin/adminregister', { email: req.session.email });
  });

  
app.get("/guest/operatorregister", (req, res) => res.render("guest/operatorregister"));

app.get("/guest/guestregister", (req, res) => res.render("guest/guestregister"));

app.get("/adminsystem/additem", isAdmin, (req, res) => res.render("adminsystem/additem", { user: req.session.user }));

app.get('/adminsystem/order', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({});
    res.render('adminsystem/order', { user: req.session.user, orders: orders });
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});

app.get('/adminsystem/order_detail', isAdmin, async (req, res) => {
    try {
      const orders = await Order.find({});
      res.render('adminsystem/order_detail', { user: req.session.user, orders: orders });
    } catch (err) {
      console.log(err);
      res.status(500).send('An error occurred: ' + err.message);
    }
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
  });



  // Start the server
app.listen(3000, () => console.log("Server is started at port 3000"));