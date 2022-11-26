import mongoose, { Schema } from 'mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const User = new Schema({
    username: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    passwordHash: {type: String, unique: true, required: true}
})
 
const Article = new Schema({
    title: String,
    url: String,
    description: String,
    author: String,
    slug: String
})

User.plugin(mongooseSlugPlugin, { tmpl: '<%=username%>' })

mongoose.model('Article', Article)
mongoose.model('User', User)

mongoose.connect('mongodb+srv://stan-stan:VLOqxdbFEVXsCzO5@cluster0.zgrjyar.mongodb.net/?retryWrites=true&w=majority', () => {
    console.log("Connected to database.")
});


