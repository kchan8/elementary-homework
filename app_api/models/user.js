var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')
var jwt = require('jsonwebtoken')
var uniqueValidator = require('mongoose-unique-validator')

var SALT_FACTOR = 10;

function getTime(t){
	return t.getHours() + ':' + t.getMinutes();
}

var userSchema = new mongoose.Schema({
	username: {type: String, unique: true},
	password: {type: String},
	userType: [String],
	registered: {type: Boolean, default: false},
	resetPasswordKey: {type: String, default: ""},
	touched: Boolean,
	backgroundColor: String,
	// uniqueID is firstname + lastname + grade + email
	uniqueID: {type: String, required: true, unique: true},
	name: {
		firstName: {type: String, required: true},
		lastName: {type: String}
		},
	gender: String,
	dob: {type: Date},
	grade: String,
	level: [{
		subject: String,
		grade: String
	}],
	school: String,
	schoolAddress: String,
	schoolCity: String,
	needPickup: {type: Boolean, default: true},
	pickup: [{pickup: String, driver: String}],	// array of 5 days + min. day
	active: {type: Boolean, default: true},
	enrollment: [{enroll: {type: Date}, last: {type: Date}}],
	teacher: [String],
	
	email: String,
	homePhone: String,
	cellPhone: String,
	carrier: String,
	homeAddress: String,
	homeCity: String,
	homeZip: String,
	parent1FirstName: String,
	parent1LastName: String,
	parent1Phone: String,
	parent1Email: String,
	relationship1: String,
	parent2FirstName: String,
	parent2LastName: String,
	parent2Phone: String,
	parent2Email: String,
	relationship2: String,
	allergies: String,
//	guardians: [{firstName: String, lastName: String, id: String}],
	children: [{firstName: String, lastName: String, id: String}],
	students: [{firstName: String, lastName: String, id: String}],
});
userSchema.plugin(uniqueValidator)
userSchema.methods.getName = function(){
	return this.name.firstName + '_' + this.name.lastName;
};
userSchema.methods.getEmail = function(){
	return this.email;
};
userSchema.methods.isEnrolled = function(date){
	if (this.enrollment[0] == undefined || this.enrollment[0] == null){
		return true;
	}
	var chkDate = new Date(date);
	var startDate = new Date(this.enrollment[0].enroll);
	var endDate = new Date(this.enrollment[0].last);
	if (chkDate.getTime() >= startDate.getTime() && chkDate.getTime() <= endDate.getTime())
		return true;
	else
		return false;
};
userSchema.methods.checkPassword = function(guess, done){
	bcrypt.compare(guess, this.password, function(err, isMatch){
		done(err, isMatch);
	});
};
userSchema.methods.generateJwt = function(client){
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 7);
	var superuser = this.email.toLowerCase() === process.env.SUPERUSER_EMAIL.toLowerCase();
	return jwt.sign({
		id: this._id,
		client: client,
		superuser: superuser,
		username: this.username,
		firstname: this.name.firstName,
		lastname: this.name.lastName,
		usertype: this.userType,
		grade: this.grade,
		level: this.level,
		email: this.email,
		children: this.children,
		exp: parseInt(expiry.getTime()/1000)
	}, process.env.JWT_SECRET);
};

var noop = function(){}
userSchema.pre('save', function(done){
	var user = this
	if (!user.isModified('password')) {
		return done()
	}
	bcrypt.genSalt(SALT_FACTOR, function(err, salt){
		if (err) {return done(err)}
		bcrypt.hash(user.password, salt, noop, function(err, hashedPassword){
			if (err){
				return done(err)
			}
			user.password = hashedPassword
			done()
		})
	})
})

//lower case with 's' at the end will be the name of collection
// Need to use mongoose.connect in app.js to establish database connection, don't use .createConnection, see
// http://blog.blairvanderhoof.com/post/37309147906/why-arent-my-models-returning-from-their-queries
var User = mongoose.model('User', userSchema);
//module.exports = User;
module.exports = userSchema;