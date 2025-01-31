const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const url = ("mongodb+srv://poonguzhalic2023cse:poova2006@poonguzhali.27dna.mongodb.net/?retryWrites=true&w=majority&appName=Poonguzhali");
const dbName = 'BlogApp';
const App = express();


App.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

App.use(express.json());


mongoose.connect(url)
    .then(()=>{
        console.log("Connected To MongoDb");
        console.log("Data Base Created!");
    })
    .catch((err)=>{
        console.log("Failed To Connect",err);
    });
    
    const UserSchema = new mongoose.Schema({
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true}
    });
    const User = mongoose.model('User',UserSchema);
    
    
App.post('/register',async(req,res)=>{
    const { username, password } = req.body;
    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({ message: 'UserName Already Exists' });
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(200).json({message: 'Registration Sucessfull'});
    }
    catch{
        console.log("Registration Failed...");
        res.status(500).json({ message: 'Internal Server Error' });
    }
})


App.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        res.status(200).json({ message: 'Login successful', user: { id: user._id, username: user.username } });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);


 // Backend route to get user profile and posts
 App.get('/user/:username', async (req, res) => {
    const { username } = req.params;
  
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
  
      res.status(200).json({
        username: user.username,
        posts: posts,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
  });


App.post('/createpost', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const newPost = new Post({ title, content });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// App.get('/posts', async (req, res) => {
//     try {
//         const posts = await Post.find().sort({ createdAt: -1 }); // Sort posts by date
//         res.status(200).json(posts);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching posts', error: error.message });
//     }
// });

//particular user
App.get('/posts', async (req, res) => {
    const { username } = req.query;  // Get the username from the query parameter
    try {
        let posts;
        if (username) {
            const user = await User.findOne({ username });
            if (user) {
                posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }); // Fetch posts by user's ID
            } else {
                return res.status(400).json({ message: 'User not found' });
            }
        } else {
            posts = await Post.find().sort({ createdAt: -1 }); // Fetch all posts if no username is provided
        }
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts', error: error.message });
    }
});

//update
App.put('/posts/update/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.title = title;
        post.content = content;
        await post.save();
        res.status(200).json({ message: 'Post updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error });
    }
});


// Backend DELETE route
App.delete('/posts/delete/:id', async (req, res) => {
    const { id } = req.params;

    console.log("Attempting to delete post with id:", id);

    try {
        // Use findByIdAndDelete directly on the Post model
        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error while deleting post:", error);
        res.status(500).json({ message: 'Error deleting post', error });
    }
});







App.listen(4000,()=>{
    console.log("Server Started");
    console.log('http://localhost:4000');
});