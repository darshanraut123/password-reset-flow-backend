const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  randomstring:{type:String,default:null}
});

module.exports = mongoose.model("User", UserSchema);
