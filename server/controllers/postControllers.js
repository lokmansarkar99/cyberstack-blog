const Post = require('../models/postModel')
const User = require('../models/UserModel')
const path = require('path')
const fs = require('fs')
const { v4: uuid } = require('uuid')
const HttpError = require('../models/errorModel')

const cloudinary = require('../cloudinary')



// ====CREATE POST
// POST: api/posts
// PROTECTED

// const createPost = async (req, res, next) => {
//   try {
//     const { title, category, description } = req.body;
//     if (
//       !title ||
//       !category ||
//       !description ||
//       !req.files ||
//       !req.files.thumbnail
//     ) {
//       return next(
//         new HttpError('Fill in all fields and choose a thumbnail', 422)
//       );
//     }

//     const { thumbnail } = req.files;

//     // Check file size (should be < 2MB)
//     if (thumbnail.size > 2000000) {
//       // 2MB in bytes
//       return next(
//         new HttpError('Thumbnail too big. File should be less than 2MB', 422)
//       );
//     }

//     const fileName = thumbnail.name;
//     const fileExtension = fileName.split('.').pop();
//     const newFileName = `${fileName.split('.')[0]}_${uuid()}.${fileExtension}`;

//     // Move the thumbnail file to the uploads folder
//     const uploadPath = path.join(__dirname, '..', 'uploads', newFileName);
//     thumbnail.mv(uploadPath, async err => {
//       if (err) {
//         return next(new HttpError('File upload error', 500));
//       }

//       try {
//         // Create the post
//         const newPost = await Post.create({
//           title,
//           category,
//           description,
//           thumbnail: newFileName,
//           creator: req.user.id,
//         });

//         if (!newPost) {
//           return next(new HttpError("Post couldn't be created", 500));
//         }

//         // Update user's post count
//         const currentUser = await User.findById(req.user.id);
//         if (currentUser) {
//           currentUser.posts += 1;
//           await currentUser.save();
//         }

//         res.status(201).json(newPost);
//       } catch (error) {
//         return next(
//           new HttpError('An error occurred while creating the post', 500)
//         );
//       }
//     });
//   } catch (error) {
//     return next(new HttpError('Server error', 500));
//   }
// };

const createPost = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    if (
      !title ||
      !category ||
      !description ||
      !req.files ||
      !req.files.thumbnail
    ) {
      return next(
        new HttpError('Fill in all fields and choose a thumbnail', 422)
      );
    }

    const { thumbnail } = req.files;

    // Check file size (should be < 2MB)
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError('Thumbnail too big. File should be less than 2MB', 422)
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
      folder: 'blogImages', // Save in blogImages folder
      public_id: `${uuid()}_${thumbnail.name.split('.')[0]}`, // Unique public ID
    });

    // Create the post
    const newPost = await Post.create({
      title,
      category,
      description,
      thumbnail: result.secure_url, // Store Cloudinary URL
      creator: req.user.id,
    });

    if (!newPost) {
      return next(new HttpError("Post couldn't be created", 500));
    }

    // Update user's post count
    const currentUser = await User.findById(req.user.id);
    if (currentUser) {
      currentUser.posts += 1;
      await currentUser.save();
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    return next(new HttpError('Server error', 500));
  }
};







// ====GET ALL POST
// GET: api/posts/
// UNPROTECTED
const getPosts = async (req, res, next) => {

   try {
     const posts = await Post.find().sort({ updatedAt: -1 });
     res.status(200).json(posts)
     
   } catch (error) {
     return next(new HttpError(error));
   }
}



// ====GET SINGLE POST
// GET: api/posts/:id
// UNPROTECTED
const getPost = async (req, res, next) => {
 try {
   const postId = req.params.id
   const post = await Post.findById(postId)
   if (!post) {
     return next(new HttpError("Post Not Found.", 404))
   }
   res.status(200).json(post)
 } catch (error) {
   return next(new HttpError(error))
  
 }
}




// ====GET  POST BY CATAGORY 
// GET: api/posts/categories/:category
// UNPROTECTED
const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 })
    res.status(200).json(catPosts)
  } catch (error) {
    return next(new HttpError(error))
  }
}


// ====GET  USER/AUTHOR POST
// GET: api/posts/users/:id
// UNPROTECTED
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 })
    res.status(200).json(posts)
  } catch (error) {
    return next(new HttpError(error))
  }
}


// ==== EDIT POST
// PATCH: api/posts/:id
// PROTECTED


// const editPost = async (req, res, next) => {
//   try {
//     let updatedPost;
//     const postId = req.params.id;
//     const { title, category, description } = req.body;

//     // Validate inputs (assuming ReactQuill minimum length requirement)
//     if (!title || !category || description.length < 12) {
//       return next(new HttpError('Fill in all fields', 422));
//     }

//     // If no files are provided, just update the text fields
//     if (!req.files || !req.files.thumbnail) {
//       updatedPost = await Post.findByIdAndUpdate(
//         postId,
//         { title, category, description },
//         { new: true }
//       );
//     } else {
//       // Get the existing post from the database
//       const oldPost = await Post.findById(postId);
//       if (!oldPost) {
//         return next(new HttpError('Post not found', 404));
//       }

//       // Remove old thumbnail file
//       fs.unlink(
//         path.join(__dirname, '..', 'uploads', oldPost.thumbnail),
//         err => {
//           if (err) {
//             console.error('Error deleting old thumbnail:', err);
//           }
//         }
//       );

//       // Handle new thumbnail file upload
//       const { thumbnail } = req.files;
//       if (thumbnail.size > 2000000) {
//         return next(
//           new HttpError('Thumbnail too big. Should be less than 2MB', 422)
//         );
//       }

//       // Generate new file name with unique ID
//       const fileNameParts = thumbnail.name.split('.');
//       const fileExtension = fileNameParts.pop();
//       const newFileName = `${fileNameParts.join(
//         '.'
//       )}_${uuid()}.${fileExtension}`;

//       // Move the new thumbnail to the uploads folder
//       await thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName));

//       // Update post with new details and new thumbnail
//       updatedPost = await Post.findByIdAndUpdate(
//         postId,
//         { title, category, description, thumbnail: newFileName },
//         { new: true }
//       );
//     }

//     if (!updatedPost) {
//       return next(new HttpError("Couldn't update post", 400));
//     }

//     res.status(200).json(updatedPost);
//   } catch (error) {
//     return next(new HttpError('Server error', 500));
//   }
// };

const editPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, category, description } = req.body;

    // Validate inputs
    if (!title || !category || description.length < 12) {
      return next(new HttpError('Fill in all fields', 422));
    }

    const oldPost = await Post.findById(postId);
    if (!oldPost) {
      return next(new HttpError('Post not found', 404));
    }

    let updatedThumbnailUrl = oldPost.thumbnail; // Default to old thumbnail

    // If a new thumbnail is uploaded, process it
    if (req.files && req.files.thumbnail) {
      const { thumbnail } = req.files;

      // Check file size
      if (thumbnail.size > 2000000) {
        return next(
          new HttpError('Thumbnail too big. File should be less than 2MB', 422)
        );
      }

      // Remove the old thumbnail from Cloudinary if it exists
      if (oldPost.thumbnail && oldPost.thumbnail.includes('res.cloudinary.com')) {
        const publicId = oldPost.thumbnail.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`blogImages/${publicId}`);
      }

      // Upload the new thumbnail to Cloudinary
      const result = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
        folder: 'blogImages', // Save in blogImages folder
        public_id: `${uuid()}_${thumbnail.name.split('.')[0]}`,
      });

      updatedThumbnailUrl = result.secure_url; // Update with new Cloudinary URL
    }

    // Update the post in the database
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, category, description, thumbnail: updatedThumbnailUrl },
      { new: true }
    );

    if (!updatedPost) {
      return next(new HttpError("Couldn't update post", 400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    return next(new HttpError('Server error', 500));
  }
};





// ==== DELETEPOST
// DELETE: api/posts/:id
// PROTECTED
// const deletePost = async (req, res, next) => {
//   res.json("Delete Post")
// }

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError('Post not found', 404));
    }

    // Check if the authenticated user is the post creator
    if (post.creator.toString() !== req.user.id) {
      return next(new HttpError('Not authorized to delete this post', 403));
    }

    // Delete the thumbnail if it exists
    if (post.thumbnail) {
      const thumbnailPath = path.join(
        __dirname,
        '..',
        'uploads',
        post.thumbnail
      );
      fs.unlink(thumbnailPath, err => {
        if (err) {
          console.error('Error deleting thumbnail:', err);
          // Log the error, but proceed with deleting the post
        }
      });
    }

    // Delete the post from the database
    await Post.findByIdAndDelete(postId);

    // Decrement the user's post count
    const user = await User.findById(req.user.id);
    if (user) {
      user.posts = Math.max(0, user.posts - 1); // Ensure post count doesn’t go negative
      await user.save();
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(new HttpError('Server error while deleting post', 500));
  }
};







module.exports = {createPost, getPost, getPosts, getCatPosts, getUserPosts, editPost, deletePost}








