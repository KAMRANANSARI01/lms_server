import {model,Schema} from "mongoose"

const PaymentSchema = new Schema({
      razorpay_payment_id : {
        type : String,
        required : [true, 'this field is mandatory']
      },
      razorpay_subscription_id : {
        type : String,
        required : [true, 'this field is mandatory']
      },
      razorpay_signature : {
        type : String,
        required : [true, 'this field is mandatory']
      }
},{
    timestamps : true
})

const Payment = model('Payment',PaymentSchema)

export default Payment;