const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];
let PURCHASED_COURSES = {};
let id = 0;

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
  res.json({ message: 'Admin created successfully' });
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  if(authenticateAdmin(req)){
    res.json({ message: 'Admin logged in successfully' });
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  var requestBody = req.body;
  if(authenticateAdmin(req)){
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
  if(authenticateAdmin(req)){
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
  if(authenticateAdmin(req)){
    res.json(COURSES);
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
  res.json({ message: 'User created successfully' });
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  if(authenticateUser(req)){
    res.json({ message: 'User logged in successfully' });
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  if(authenticateUser(req)){
    res.json(COURSES);
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  var courseId = req.params.courseId;
  var username = req.headers.username;
  if (!PURCHASED_COURSES.hasOwnProperty(username)) {
    PURCHASED_COURSES[username] = [];
  }
  if(authenticateUser(req)){
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
  var username = req.headers.username;
  if (!PURCHASED_COURSES.hasOwnProperty(username)) {
    PURCHASED_COURSES[username] = [];
  }
  if(authenticateUser(req)){
    res.json({purchasedCourses: PURCHASED_COURSES[username]})
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.listen(3002, () => {
  console.log('Server is listening on port 3002');
});
