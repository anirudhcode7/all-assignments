const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];
let PURCHASED_COURSES = {};
let id = 0;
const secret_key = "66578c57-1b88-407c-b8a7-910b7694c6c8"

function createJWTToken(req){
  const username = req.headers.username;
  const password = req.headers.password;
  const payload = {username: username, password: password};
  console.log(payload);
  const expiresIn = '1h';
  const token = jwt.sign(payload, secret_key, {expiresIn});
  console.log(token);
  return token;
}

function verifyJWTToken(req){
  var token = req.headers.authorization.split(' ')[1].trim();
  console.log("Token received: ",token);
  try {
    const decodedToken = jwt.verify(token, secret_key)
    console.log(decodedToken)
    const currentTimestamp = Math.floor(Date.now() / 1000); // Get current UNIX timestamp

    if (decodedToken.exp && decodedToken.exp >= currentTimestamp) {
      // Token has not expired
      console.log('Token is valid.');
      return true;
    } else {
      // Token has expired
      console.log('Token has expired.');
      return false;
    }
  } catch (error){
    console.log(error);
    return false;
  }
    
}

function extractUserNameFromToken(req) {
  var token = req.headers.authorization.split(' ')[1].trim();
  console.log("Token received: ",token);
  try {
    const decodedToken = jwt.verify(token, secret_key);
    console.log("Token decoded: ",decodedToken);
    const username = decodedToken.username; // Assuming the user ID is stored as 'username' in the token payload
    return username;
  } catch (error) {
    console.log('Error extracting username from token:', error);
    return null;
  }
}


function authenticateAdmin(req){
  const { username, password } = req.headers;
  const user = ADMINS.find(u => u.username === username && u.password === password);
  if (user) {
    return true;
  }
  else return false;
}


// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  ADMINS.push(req.body);
  // token = createJWTToken(req);
  res.json({ message: 'Admin created successfully'});
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  if(authenticateAdmin(req)){
    token = createJWTToken(req);
    res.json({ message: 'Admin logged in successfully', token: token });
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  var requestBody = req.body;
  if(verifyJWTToken(req)){
    id += 1;
    requestBody.courseId = id;
    COURSES.push(requestBody);
    res.json({ message: 'Course created successfully', courseId: id });
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
  console.log("POST: ",COURSES);
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  if(verifyJWTToken(req)){
    var courseId = req.params.courseId;
    const courseIndex = COURSES.findIndex(c => c.courseId == courseId);
    if(courseIndex!=-1){
      var reqBody = req.body;
      reqBody.courseId = courseId;
      COURSES[courseIndex] = reqBody;
      res.json({ message: 'Course updated successfully' });
    }
    else {
      res.json({ message: 'Course not found' });
    }
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
  console.log("PUT: ",COURSES);
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  if(verifyJWTToken(req)){
    res.json({courses: COURSES});
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
  console.log("GET: ",COURSES);
});

function authenticateUser(req){
  var username = req.headers.username;
  var password = req.headers.password;
  const user = USERS.find(u => u.username === username && u.password === password);
  if(user) return true;
  return false;
}

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  USERS.push(req.body);
  // token = createJWTToken(req);
  res.json({ message: 'User created successfully'});
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  if(authenticateUser(req)){
    token = createJWTToken(req);
    res.json({ message: 'User logged in successfully', token: token });
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  if(verifyJWTToken(req)){
    res.json(COURSES);
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  var courseId = req.params.courseId;
  var username = extractUserNameFromToken(req);
  if(verifyJWTToken(req)){
    if(username){
      if (!PURCHASED_COURSES.hasOwnProperty(username)) {
        PURCHASED_COURSES[username] = [];
      }
    }
    else {
      res.json({message: 'Username could not be fetched'})
    }
    const course = COURSES.find(c => c.courseId == courseId);
    if(course){
      PURCHASED_COURSES[username].push(course);
      res.json({ message: 'Course purchased successfully' });
    }
    else {
      res.json({ message: 'Course not found' });
    }
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses

  if(verifyJWTToken(req)){
    var username = extractUserNameFromToken(req);
    if(username){
      if (!PURCHASED_COURSES.hasOwnProperty(username)) {
        PURCHASED_COURSES[username] = [];
      }
    }
    else {
      res.json({message: 'Username could not be fetched'})
    }
    res.json({purchasedCourses: PURCHASED_COURSES[username]})
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.listen(3003, () => {
  console.log('Server is listening on port 3003');
});
