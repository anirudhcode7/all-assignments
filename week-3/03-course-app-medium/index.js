const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const directoryPath = './files';

if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
  console.log('Directory created successfully.');
} else {
  console.log('Directory already exists.');
}


function createFileIfNotExists(filePath, initializeWith){
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initializeWith, 'utf8');
    console.log('File created successfully.');
  } else {
    console.log('File already exists.');
  }  
}

let ADMINS = './files/admins.json';
let USERS = './files/users.json';
let COURSES = './files/courses.json';
let PURCHASED_COURSES = './files/purchased_courses.json';

createFileIfNotExists(ADMINS, initializeWith='[]')
createFileIfNotExists(USERS, initializeWith='[]')
createFileIfNotExists(COURSES, initializeWith='[]')
createFileIfNotExists(PURCHASED_COURSES, initializeWith='{}')

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

function appendDataToJSONFile(filePath, dataToAppend, res, message) {
  // Step 1: Read the existing JSON file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      // Step 2: Parse the JSON file into a JavaScript object
      const existingData = JSON.parse(data);

      // Step 3: Check if the data already exists
      const isDataExisting = existingData.some((item) => {
        return Object.keys(dataToAppend).every((key) => item[key] === dataToAppend[key]);
      });

      if (isDataExisting) {
        console.log('Data already exists. Skipping append.');
        res.send('Data already exists.');
        return;
      }

      // Step 4: Modify the object (add or update data)
      existingData.push(dataToAppend);

      // Step 5: Convert the object back to a JSON string
      const newData = JSON.stringify(existingData);

      // Step 6: Write the JSON string to the file (overwrite the existing content)
      fs.writeFile(filePath, newData, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('Data appended successfully!');
        res.send(message);
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}

function readDataFromJSONFile(filePath,callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    try{
      const fileData = JSON.parse(data);
      callback(fileData);
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}

function updateCoursesInJSONFile(dataToUpdate, courseId, res){
  console.log("courseId:", courseId);
  fs.readFile(COURSES, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    try {
      const existingData = JSON.parse(data);
      const itemToUpdate = existingData.find((item) => {
        return item.courseId == courseId
      })

      if(itemToUpdate){
        console.log("Item found");
        Object.assign(itemToUpdate, dataToUpdate);
      }
      else {
        console.log("Item not found.")
        res.send({ message: 'Course not found' });
        return;
      }

      const newData = JSON.stringify(existingData);
      fs.writeFile(COURSES, newData, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          return;
        }
        console.log('Data updated successfully!');
        res.send( { message: 'Course updated successfully', courseId: courseId });
      })
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
    }
  })
}

function getCourseFromCourseId(courseId,callback) {
  console.log("courseId: ", courseId)
  fs.readFile(COURSES, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      callback(undefined);
    }
    try {
      const existingData = JSON.parse(data);
      const course = existingData.find((item) => {
        return item.courseId == courseId
      })
      if(! course){
        console.log("Course not found.")
      }
      callback(course);
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
    }
  })
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

function purchaseCourseForUser(course, username,res){
  console.log("courseId:", course.courseId);
  fs.readFile(PURCHASED_COURSES, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    try {
      const existingData = JSON.parse(data);
      if(! existingData.hasOwnProperty(username)){
        existingData[username] = []
      }
      existingData[username].push(course);
      console.log("existingData: ", existingData);
      const newData = JSON.stringify(existingData);

      fs.writeFile(PURCHASED_COURSES, newData, 'utf8', (err) => {
        if (err) {
          console.error('Error wr0iting file:', err);
          return;
        }
        console.log('Course purchased successfully');
        res.send( { message: 'Course purchased successfully' });
      })
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
    }
  })
}


function authenticate(filename,req, callback){
  const { username, password } = req.headers;
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      callback(false);
      return;
    }
    try {
      const admins = JSON.parse(data);
      const isDataExisting = admins.some((item) => {
        return item.username === username && item.password === password;
      });

      if (isDataExisting) {
        console.log('Authentication Successful');
        callback(true);
      }
      else {
        console.log('Authentication Failed');
        callback(false);
      }
    }
    catch(err){
      console.error('Error parsing JSON:', err);
      callback(false);
    }
  })
}


// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  appendDataToJSONFile(ADMINS, req.body, res, {message:'Admin created successfully'});
  // token = createJWTToken(req);
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  authenticate(ADMINS,req, (authenticated)=>{
    if(authenticated){
      console.log("hello world test")
      token = createJWTToken(req);
      res.json({ message: 'Admin logged in successfully', token: token });
    }
    else {
      res.json({ message: 'Admin authentication failed' });
    }
  })
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  var requestBody = req.body;
  if(verifyJWTToken(req)){
    id += 1;
    requestBody.courseId = id;
    appendDataToJSONFile(COURSES, requestBody, res, { message: 'Course created successfully', courseId: id });
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
    var requestBody = req.body;
    updateCoursesInJSONFile(requestBody, courseId, res);
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
  console.log("PUT: ",COURSES);
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  if(verifyJWTToken(req)){
    readDataFromJSONFile(COURSES, (data) => {
      res.json({courses: data})
    });
  }
  else{
    res.json({ message: 'Admin authentication failed' });
  }
  console.log("GET: ",COURSES);
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  appendDataToJSONFile(USERS, req.body, res, {message:'User created successfully'});
  // token = createJWTToken(req);
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  authenticate(USERS,req, (authenticated)=>{
    if(authenticated){
      token = createJWTToken(req);
      res.json({ message: 'User logged in successfully', token: token });
    }
    else {
      res.json({ message: 'User authentication failed' });
    }
  });
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  if(verifyJWTToken(req)){
    readDataFromJSONFile(COURSES, (data) => {
      res.json(data)
    });
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
      getCourseFromCourseId(courseId, (course)=>{
        if(course){
          console.log("hello")
          purchaseCourseForUser(course, username,res)
        }
        else {
          res.json({ message: 'Course not found' });
        }
      })
    }
    else {
      res.json({message: 'Username could not be fetched'})
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
      fs.readFile(PURCHASED_COURSES, 'utf8', (err, data) => {
        if(err){
          console.error('Error reading file:', err);
          return;
        }
        try {
          const existingData = JSON.parse(data);
          if (!existingData.hasOwnProperty(username)) {
            existingData[username] = [];
          }
          res.json({purchasedCourses: existingData[username]})
        }
        catch (error) {
          console.error('Error parsing JSON:', error);
          return;
        }
      })
    }
    else {
      res.json({message: 'Username could not be fetched'})
    }
  }
  else {
    res.json({ message: 'User authentication failed' });
  }
});

app.listen(3004, () => {
  console.log('Server is listening on port 3004');
});
