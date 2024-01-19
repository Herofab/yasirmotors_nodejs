const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const Cars = require('../model/cars');
const Order = require('../model/orders');
const fs = require('fs');

const path = require('path');

const { Guest, Notification } = require('../model/guests');




const router = express.Router();



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },  
  filename: function (req, file, cb) {
    const originalFilename = file.originalname.replace(/\..+$/, '');
    const extension = file.originalname.split('.').pop();
    cb(null, originalFilename + '-' + Date.now() + '.' + extension);
  }
});

const upload = multer({ storage: storage });

router.get('/admin-dashboard', (req, res) => res.send('Admin Dashboard'));

router.get('/user-dashboard', (req, res) => res.send('User Dashboard'));

router.get("/adminsystem/sales", (req, res) => res.render("adminsystem/sales"));

router.get('/confirmation', (req, res) => {
  res.render('confirmation');
});

router.get("/newarrivals", (req, res) => res.render("newarrivals"));



router.get("/guest/operatorregister", (req, res) => res.render("guest/operatorregister"));

router.get("/guest/guestregister", (req, res) => res.render("guest/guestregister"));

router.get("/login", (req, res) => res.render("login"));



// Remove this line
const sharp = require('sharp');



router.post('/cars', upload.any(), async (req, res) => {
  try {
    const imageFile = req.files.find(file => file.fieldname === 'image');
    const imageFiles = req.files.filter(file => file.fieldname === 'images[]');

    // Process the single image file
    const processedImage = await sharp(imageFile.path)
      .resize(1000, 1000, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: 80 })
      .toFile(path.join(__dirname, '../public/uploads/', imageFile.filename + '.webp'));

    // Process the multiple image files
    const processedImages = await Promise.all(imageFiles.map(async file => {
      await sharp(file.path)
        .resize(1000, 1000, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 80 })
        .toFile(path.join(__dirname, '../public/uploads/', file.filename + '.webp'));

      return '/public/uploads/' + file.filename + '.webp';
    }));

    // Create a new car object using the form data
    const car = new Cars({
      ...req.body,
      image: processedImage ? '/public/uploads/' + imageFile.filename + '.webp' : '',
      images: processedImages
    });

    // Save the new car to the database
    await car.save();
    res.redirect('/adminsystem/additem');
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});





router.get('/rent-car/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const car = await Cars.findById(carId);
    if (!car) {
      return res.status(404).send('Car not found');
    }
    const today = new Date();
    const minDate = today.toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD
    res.render('product_display', { car: car, minDate: minDate });
  } catch (err) {
    console.error('Error in /rent-car/:id route:', err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});

router.post('/book', async (req, res) => {
  try {
    // Extract booking details from the form submission
    const { fromdate, todate, quantity, carId } = req.body;
 
    // Find the car by ID to get the details for the order
    const car = await Cars.findById(carId);
    if (!car) {
      return res.status(404).send('Car not found');
    }
 
    // Calculate the total price based on the quantity
    const totalQuantity = parseInt(quantity, 10);
    const totalPrice = car.price * totalQuantity;
 
    // Create a new order with the booking details
    const newOrder = new Order({
      fromdate,
      todate,
      quantity: totalQuantity,
      car_detail: [{
        engine_number: car.engine_number,
        title: car.title,
        price: car.price,
        color1: car.color1,
        brand: car.brand,
        image: car.image,
        // Add other car details you want to include in the order
      }],
      Total_price: totalPrice // Include the total price in the order
      // Add other order details (e.g., user information) if necessary
    });
 
    // Save the new order to the database
    await newOrder.save();
 
    // Send a success response
    res.status(201).render('orderproceeding/checkout' , { order: newOrder, totalPrice: totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while placing the order');
  }
 });

 router.post('/update-order', async (req, res) => {
  try {
    // Extract order ID and additional details from the form submission
    const { orderId, email, firstname, lastname, address1, address2, city, card_number, phone, phone2, notification } = req.body;

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Update the order with the additional details
    order.email = email;
    order.firstname = firstname;
    order.lastname = lastname;
    order.address1 = address1;
    order.address2 = address2;
    order.city = city;
    order.card_number = card_number;
    order.phone = phone;
    order.phone2 = phone2;
    order.notification = notification;
    // Do not update quantity and total_price

    // Save the updated order to the database
    await order.save();

    // Render the confirmation page with the updated order details and orderId
    res.render('confirmation', { order: order, orderId: orderId });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});

// order detail 
router.get('/adminsystem/order_detail/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).send('Order not found');
    } else {
      res.render('adminsystem/order_detail', { order: order });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});
// change the order status to shipping
router.get('/adminsystem/change_status/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).send('Order not found');
    } else {
      order.status = 'shipping';
      await order.save();
      res.redirect('/adminsystem/order_detail/' + orderId);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});
// OTP system
const otps = {};

const nodemailer = require('nodemailer');

// Create a Nodemailer transporter
// Replace with your email provider's SMTP settings
// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'umeramin1821644@gmail.com',
    pass: 'isyzfkeyebbtfpyi'
  }
});

router.post('/send-otp', async (req, res) => {
  const orderId = req.body.orderId;
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404).send('Order not found');
    return;
  }

  // Generate a random OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Store the OTP for this order
  otps[orderId] = otp;

  // Send the OTP to the user's email
  transporter.sendMail({
    from: 'umeramin1821644@gmail.com', // Use your email address
    to: order.email,
    subject: 'Your OTP',
    text: `Your OTP is ${otp}`
  }, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('An error occurred: ' + error.message);
    } else {
      console.log('Email sent: ' + info.response);
      res.send('OTP sent');
    }
  });
});
// otp verification

router.post('/verify-otp', async (req, res) => {
  const orderId = req.body.orderId;
  const otp = req.body.otp;
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404).send('Order not found');
    return;
  }

  // Check if the OTP is correct
  if (otps[orderId] !== Number(otp)) {
    res.status(400).send('Incorrect OTP');
    return;
  }

  // If the OTP is correct, confirm the order
  order.status = 'confirmed';
  await order.save();

  // Send the order details to the user's email
  let orderDetails = '';
  order.car_detail.forEach(product => {
    orderDetails += `Product ID: ${product._id}, Quantity: ${product.quantity}, Size: ${product.selectedSize}, Color: ${product.selectedColor}\n`;
  });

  transporter.sendMail({
    from: 'umeramin1821644@gmail.com', // Use your email address
    to: order.email + ', mailstoumer@gmail.com', // Add the additional email address here
    subject: 'Your Order Details',
    html: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>adminsystem/order-detail</title>
    
  </head>
  <body>
      
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title> Order confirmation </title>
  <meta name="robots" content="noindex,nofollow" />
  <meta name="viewport" content="width=device-width; initial-scale=1.0;" />
  <style type="text/css">
    @import url(https://fonts.googleapis.com/css?family=Open+Sans:400,700);
    body { margin: 0; padding: 0; background: #e1e1e1; }
    div, p, a, li, td { -webkit-text-size-adjust: none; }
    .ReadMsgBody { width: 100%; background-color: #ffffff; }
    .ExternalClass { width: 100%; background-color: #ffffff; }
    body { width: 100%; height: 100%; background-color: #e1e1e1; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    html { width: 100%; }
    p { padding: 0 !important; margin-top: 0 !important; margin-right: 0 !important; margin-bottom: 0 !important; margin-left: 0 !important; }
    .visibleMobile { display: none; }
    .hiddenMobile { display: block; }
  
    @media only screen and (max-width: 600px) {
    body { width: auto !important; }
    table[class=fullTable] { width: 96% !important; clear: both; }
    table[class=fullPadding] { width: 85% !important; clear: both; }
    table[class=col] { width: 45% !important; }
    .erase { display: none; }
    }
  
    @media only screen and (max-width: 420px) {
    table[class=fullTable] { width: 100% !important; clear: both; }
    table[class=fullPadding] { width: 85% !important; clear: both; }
    table[class=col] { width: 100% !important; clear: both; }
    table[class=col] td { text-align: left !important; }
    .erase { display: none; font-size: 0; max-height: 0; line-height: 0; padding: 0; }
    .visibleMobile { display: block !important; }
    .hiddenMobile { display: none !important; }
    }
  </style>
  
  
  <!-- Header -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#e1e1e1">
    <tr>
      <td height="20"></td>
    </tr>
    <tr>
      <td>
        <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#ffffff" style="border-radius: 10px 10px 0 0;">
          <tr class="hiddenMobile">
            <td height="40"></td>
          </tr>
          <tr class="visibleMobile">
            <td height="30"></td>
          </tr>
  
          <tr>
            <td>
              <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                <tbody>
                  <tr>
                    <td>
                      <table width="220" border="0" cellpadding="0" cellspacing="0" align="left" class="col">
                        <tbody>
                          <tr>
                            <td align="left"> <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqbv0AhmGKBHPq6tCcJXSAL_oyEgHBRhDKNrF0TO_vqg&s" width="32" height="32" alt="logo" border="0" /></td>
                          </tr>
                          <tr class="hiddenMobile">
                            <td height="40"></td>
                          </tr>
                          <tr class="visibleMobile">
                            <td height="20"></td>
                          </tr>
                          <tr>
                            <td style="font-size: 12px; color: #5b5b5b; font-family: 'Open Sans', sans-serif; line-height: 18px; vertical-align: top; text-align: left;">
                            Hello, ${order.firstname}
                              <br> Thank you for shopping from our store and for your order.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <table width="220" border="0" cellpadding="0" cellspacing="0" align="right" class="col">
                        <tbody>
                          <tr class="visibleMobile">
                            <td height="20"></td>
                          </tr>
                          <tr>
                            <td height="5"></td>
                          </tr>
                          <tr>
                            <td style="font-size: 21px; color: #ff0000; letter-spacing: -1px; font-family: 'Open Sans', sans-serif; line-height: 1; vertical-align: top; text-align: right;">
                              Invoice
                            </td>
                          </tr>
                          <tr>
                          <tr class="hiddenMobile">
                            <td height="50"></td>
                          </tr>
                          <tr class="visibleMobile">
                            <td height="20"></td>
                          </tr>
                          <tr>
                            <td style="font-size: 12px; color: #5b5b5b; font-family: 'Open Sans', sans-serif; line-height: 18px; vertical-align: top; text-align: right;">
                              <small>Order ID:</small>  ${order.shortId}<br />
                              <small>MARCH 4TH 2016</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!-- /Header -->
  <!-- Order Details -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#e1e1e1">
    <tbody>
      <tr>
        <td>
          <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#ffffff">
            <tbody>
              <tr>
              <tr class="hiddenMobile">
                <td height="60"></td>
              </tr>
              <tr class="visibleMobile">
                <td height="40"></td>
              </tr>
              <tr>
                <td>
                  <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                    <tbody>
                      <tr>
                        <th style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; font-weight: 600; line-height: 1; vertical-align: top; " align="left">
                         Car
                        </th>
                       
                        <th style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; font-weight: 600; line-height: 1; vertical-align: top; padding: 0 0 7px;" align="left">
                          No of Cars
                        </th>
                        <th style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; font-weight: 600; line-height: 1; vertical-align: top; padding: 0 0 7px;" align="center">
                          From Date
                        </th>
                        <th style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; font-weight: 600; line-height: 1; vertical-align: top; padding: 0 0 7px;" align="center">
                          To Date
                        </th>
                        <th style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #1e2b33; font-weight: 600; line-height: 1; vertical-align: top; padding: 0 0 7px;" align="right">
                          Subtotal
                        </th>
                      </tr>
                      <tr>
                        <td height="1" style="background: #bebebe;" colspan="12"></td>
                      </tr>
                      <tr>
                        <td height="10" colspan="4"></td>
                      </tr>
                      ${order.car_detail.map(product => `
                          <tr>
                            <td style="vertical-align: top; padding:10px 0;" class="article">
                              <img style="width: 30px;height: 30px;" src="${product.image.replace('/public', '')}" alt="${product.title}">
                            </td>
                            <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #646a6e;  line-height: 18px;  vertical-align: top; padding:10px 0;" align="center">${order.quantity}</td>
                            <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #1e2b33;  line-height: 18px;  vertical-align: top; padding:10px 0;" align="right">${order.fromdate.toDateString()}</td>
                            <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #1e2b33;  line-height: 18px;  vertical-align: top; padding:10px 0;" align="right">${order.todate.toDateString()}</td>
                            <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #1e2b33;  line-height: 18px;  vertical-align: top; padding:10px 0;" align="right">${product.price}</td>
                          </tr>
                          <tr>
                            <td height="1" colspan="12" style="border-bottom:1px solid #e4e4e4"></td>
                          </tr>
                        `).join('')}
                      
                     
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td height="20"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <!-- /Order Details -->
  <!-- Total -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#e1e1e1">
    <tbody>
      <tr>
        <td>
          <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#ffffff">
            <tbody>
              <tr>
                <td>
  
                  <!-- Table Total -->
                  <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                      <tbody>
                        <tr>
                          <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #000; line-height: 22px; vertical-align: top; text-align:right; ">
                            <strong>Grand Total (Incl.Shipping)</strong>
                          </td>
                          <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #000; line-height: 22px; vertical-align: top; text-align:right; ">
                            <strong>${order.Total_price}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  <!-- /Table Total -->
  
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <!-- /Total -->
  <!-- Information -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#e1e1e1">
    <tbody>
      <tr>
        <td>
          <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#ffffff">
            <tbody>
              <tr>
              <tr class="hiddenMobile">
                <td height="60"></td>
              </tr>
              <tr class="visibleMobile">
                <td height="40"></td>
              </tr>
              <tr>
                <td>
                  <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                    <tbody>
                      <tr>
                        <td>
                          <table width="220" border="0" cellpadding="0" cellspacing="0" align="left" class="col">
  
                            <tbody>
                              <tr>
                                <td style="font-size: 11px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 1; vertical-align: top; ">
                                  <strong>BILLING INFORMATION</strong>
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="10"></td>
                              </tr>
                              <tr>
                                  <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 20px; vertical-align: top; ">
                                    ${order.firstname}<br> ${order.address1}<br>  ${order.postal_code}, PAKISTAN<br> T: ${order.phone}
                                  </td>
                                </tr>
                            </tbody>
                          </table>
  
  
                          <table width="220" border="0" cellpadding="0" cellspacing="0" align="right" class="col">
                            <tbody>
                              <tr class="visibleMobile">
                                <td height="20"></td>
                              </tr>
                              <tr>
                                <td style="font-size: 11px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 1; vertical-align: top; ">
                                  <strong>PAYMENT METHOD</strong>
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="10"></td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 20px; vertical-align: top; ">
                                  Credit Card<br> Credit Card Type: Visa<br> Worldpay Transaction ID: <a href="#" style="color: #ff0000; text-decoration:underline;">4185939336</a><br>
                                  <a href="#" style="color:#b0b0b0;">Right of Withdrawal</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                    <tbody>
                      <tr>
                        <td>
                          <table width="220" border="0" cellpadding="0" cellspacing="0" align="left" class="col">
                            <tbody>
                              <tr class="hiddenMobile">
                                <td height="35"></td>
                              </tr>
                              <tr class="visibleMobile">
                                <td height="20"></td>
                              </tr>
                              <tr>
                                <td style="font-size: 11px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 1; vertical-align: top; ">
                                  <strong>SHIPPING INFORMATION</strong>
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="10"></td>
                              </tr>
                              <tr>
                                  <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 20px; vertical-align: top; ">
                                    Sup Inc<br> ${order.address2}<br> ${order.postal_code}, PAKISTAN<br> T: ${order.phone}
                                  </td>
                                </tr>
                            </tbody>
                          </table>
  
  
                          <table width="220" border="0" cellpadding="0" cellspacing="0" align="right" class="col">
                            <tbody>
                              <tr class="hiddenMobile">
                                <td height="35"></td>
                              </tr>
                              <tr class="visibleMobile">
                                <td height="20"></td>
                              </tr>
                              <tr>
                                <td style="font-size: 11px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 1; vertical-align: top; ">
                                  <strong>SHIPPING METHOD</strong>
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="10"></td>
                              </tr>
                              <tr>
                                <td style="font-size: 12px; font-family: 'Open Sans', sans-serif; color: #5b5b5b; line-height: 20px; vertical-align: top; ">
                                  TCS: PAKISTAN. Shipping Services
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr class="hiddenMobile">
                <td height="60"></td>
              </tr>
              <tr class="visibleMobile">
                <td height="30"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <!-- /Information -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#e1e1e1">
  
    <tr>
      <td>
        <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" class="fullTable" bgcolor="#ffffff" style="border-radius: 0 0 10px 10px;">
          <tr>
            <td>
              <table width="480" border="0" cellpadding="0" cellspacing="0" align="center" class="fullPadding">
                <tbody>
                  <tr>
                    <td style="font-size: 12px; color: #5b5b5b; font-family: 'Open Sans', sans-serif; line-height: 18px; vertical-align: top; text-align: left;">
                      Have a nice day.
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr class="spacer">
            <td height="50"></td>
          </tr>
  
        </table>
      </td>
    </tr>
    <tr>
      <td height="20"></td>
    </tr>
  </table> 
  </body>
  </html>
  `
  }, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('An error occurred: ' + error.message);
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Booking confirmed');
    }
  });
});

// image auto resizer
router.get('/penta/adminregister', (req, res) => {
  res.render('penta/adminregister', { email: req.session.email });
});


const transporters = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'umeramin1821644@gmail.com',
    pass: 'isyzfkeyebbtfpyi'
  }
});
router.post('/penta/adminregister', async (req, res) => {
  const email = 'mailstoumer@gmail.com'; // Get the user's email from the request
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random OTP

  otps[email] = otp; // Store the OTP for this email

  transporters.sendMail({
    from: 'umeramin1821644@gmail.com',
    to: email, // Send the OTP to the user's email
    subject: 'Your OTP',
    text: `Your OTP is ${otp} `
  }, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('An error occurred: ' + error.message);
    } else {
      console.log('Email sent: ' + info.response);
      res.render("penta/adminregister", { message: 'OTP sent, please check your email' });
    }
  });
});

router.post('/verify-registration-otp', async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;
  const user = await User.findOne({ email: email });

  if (!user) {
    res.status(404).send('User not found');
    return;
  }

  if (otps[email] !== Number(otp)) {
    res.status(400).send('Incorrect OTP');
    return;
  }

  user.status = 'confirmed';
  await user.save();

  res.send('User registration confirmed');
});
//sales Department

router.post('/apply-discount', async (req, res) => {
  let discount = Number(req.body.discount);
  if (isNaN(discount)) {
    res.status(400).send('Invalid discount value');
    return;
  }
  const cars = await Car.find({ product_status: { $ne: 'sale' }});
  if (cars.length === 0) {
    res.send('No cars to apply discount to');
    return;
  }
  cars.forEach(async (car) => {
    const old_price = car.price;
    const price = Math.round(car.price - (car.price * (discount / 100)));
    await Car.updateOne({ _id: car._id }, { product_status: 'sale', old_price, old_price, discount, price });
    const updatedCar = await Car.findById(car._id);
    console.log(`Updated car: `, updatedCar);
  });
  res.send('Discount applied to cars');
});

//sales department 

//apply sales according to brand
router.post('/apply-brand-discount', async (req, res) => {
  let discount = Number(req.body.discount);
  let brand = req.body.brand;
  if (isNaN(discount)) {
      res.status(400).send('Invalid discount value');
      return;
  }
  const cars = await Car.find({ brand: brand, product_status: { $ne: 'sale' }});
  if (cars.length === 0) {
      res.send('No cars to apply discount to');
      return;
  }
  cars.forEach(async (car) => {
      const old_price = car.price;
      const price = Math.round(car.price - (car.price * (discount / 100)));
      await Car.updateOne({ _id: car._id }, { product_status: 'sale', old_price, discount, price });
      const updatedCar = await Car.findById(car._id);
      console.log(`Updated car: `, updatedCar);
  });
  res.send('Discount applied to cars');
});

router.post('/remove-brand-discount', async (req, res) => {
  let brand = req.body.brand;
  const cars = await Car.find({ brand: brand, product_status: 'sale' });
  if (cars.length === 0) {
      res.send('No discount to remove');
      return;
  }
  cars.forEach(async (car) => {
      const price = car.old_price;
      await Car.updateOne({ _id: car._id }, { product_status: '', old_price: undefined, discount: undefined, price });
  });
  res.send('Discount removed from cars');
});

router.post('/remove-discount', async (req, res) => {
  const cars = await Car.find({ product_status: 'sale' });
  if (cars.length === 0) {
      res.send('No discount to remove');
      return;
  }
  cars.forEach(async (car) => {
      const price = car.old_price;
      await Car.updateOne({ _id: car._id }, { product_status: '', old_price: undefined, discount: undefined, price });
  });
  res.send('Discount removed from cars');
});
// colors express code
router.get("/get-distinct-colors", async (req, res) => {
  try {
    const colors = await Newarrival.distinct('color1', { gender: 'men' });
    res.json(colors);
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred: ' + err.message);
  }
});






module.exports = router;