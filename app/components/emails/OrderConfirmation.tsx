import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  items: {
    name: string;
    quantity: number;
    price: string;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export const OrderConfirmationEmail = ({
  customerName,
  orderId,
  orderDate,
  totalAmount,
  items,
  shippingAddress,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - Hudemas #{orderId}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src="https://hudemas-store.vercel.app/logo.png"
                width="40"
                height="37"
                alt="Hudemas"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Thank you for your order!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We have received your order and are getting it ready to be shipped. We will notify you when it has been sent.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-black text-[14px] font-bold">
                Order #{orderId}
              </Text>
              <Text className="text-gray-500 text-[12px]">
                {orderDate}
              </Text>
            </Section>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Section>
              <Text className="text-black text-[14px] font-bold mb-4">Order Summary</Text>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between mb-2">
                  <Text className="text-black text-[14px] m-0 w-[70%]">
                    {item.name} x {item.quantity}
                  </Text>
                  <Text className="text-black text-[14px] m-0 font-medium">
                    {item.price}
                  </Text>
                </div>
              ))}
              <Hr className="border border-solid border-[#eaeaea] my-[10px] mx-0 w-full" />
              <div className="flex justify-between mt-2">
                <Text className="text-black text-[14px] m-0 font-bold">Total</Text>
                <Text className="text-black text-[14px] m-0 font-bold">{totalAmount}</Text>
              </div>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section>
              <Text className="text-black text-[14px] font-bold mb-2">Shipping Address</Text>
              <Text className="text-black text-[14px] m-0">
                {shippingAddress.street}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}<br />
                {shippingAddress.country}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you have any questions, reply to this email or contact us at <Link href="mailto:office@hudemas.ro" className="text-blue-600 no-underline">office@hudemas.ro</Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmationEmail;
