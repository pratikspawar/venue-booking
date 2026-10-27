declare module 'react-native-razorpay' {
  type Options = {
    key: string;
    amount: number | string;
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    prefill?: { name?: string; contact?: string; email?: string };
    theme?: { color?: string };
  };
  const RazorpayCheckout: {
    open(options: Options): Promise<{ razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }>;
  };
  export default RazorpayCheckout;
}
