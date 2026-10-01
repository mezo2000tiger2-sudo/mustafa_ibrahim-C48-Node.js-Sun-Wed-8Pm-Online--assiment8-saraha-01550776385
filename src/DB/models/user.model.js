import mongoose from "mongoose";

const userSchema =new mongoose.Schema({
    fName:{
        type:String,
        required:true,
        trim:true,
        minLength:2,
        maxLength: 50
    },
    lName:{
        type:String,
        required:true,
        trim:true,
        minLength:2,
        maxLength:50,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        validate: {
        validator: function (value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please enter a valid email"
    }
    },
    phone: String,
    password:{
        type:String,
        required:true,
        trim:true,
    },
    age:{
        type:Number,
        required:function(){
            return this.providor =='system'
        }, 
        min:18,
        max:60
    },
    password:{
        type:String,
        required:function(){
            return this.providor =='system' ? true : false 
        },
    },
    gender:{
        type:String,
        enum:['male','female'],
        default:'male'
        
    },
    profileImage:String,
    providor:{
        type:String,
        enum:['system','google'],
        default:'system'
    },
    isConfirmed:{
        type:Boolean,
        default:false
    }
},{
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    virtuals: {
    fullName: {
      get() {
        return this.fName + ' ' + this.lName;
      },
      set(v) {
        const [fName ,lName]=v.split(' ')
        this.fName = fName;
        this.name.last = lName;
      }
    }
  }
}
)
const userModel =mongoose.model.User || mongoose.model('User',userSchema)
export default userModel