'use client';

import { Container, Title, Text, Stack, Divider, List, Anchor, Alert } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';

export default function RefundPolicyPage() {
    const lastUpdated = 'January 31, 2026';
    const version = '1.1';
    const contactEmail = 'feldenserra@proton.me';

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <div>
                    <Title order={1}>Refund Policy</Title>
                    <Text c="dimmed" size="sm" mt="xs">Last Updated: {lastUpdated} | Version: {version}</Text>
                </div>

                <Text>
                    Thank you for subscribing to HomeCoreOS. Please read our refund policy carefully before making a purchase.
                </Text>

                <Divider />

                <section>
                    <Title order={2} size="h3" mb="sm">1. Free Trial</Title>
                    <Text>
                        HomeCoreOS offers a <strong>7-day free trial</strong> for all new users. During this period, you have full access to all features at no cost. We encourage you to thoroughly explore the service during your trial to ensure it meets your needs.
                    </Text>
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" mt="md">
                        Your subscription will automatically begin and your payment method will be charged at the end of the trial period unless you cancel before the trial ends.
                    </Alert>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">2. Subscription Terms</Title>
                    <List>
                        <List.Item>HomeCoreOS is billed at <strong>$6.99 per month</strong> (plus applicable taxes)</List.Item>
                        <List.Item>Subscriptions automatically renew each month on the same day you originally subscribed</List.Item>
                        <List.Item>You may cancel your subscription at any time through your account settings</List.Item>
                        <List.Item>Price changes will be communicated at least 30 days in advance</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">3. Payment Authorization</Title>
                    <Text>
                        By providing a payment method and subscribing to HomeCoreOS, you authorize us (through our payment processor, Paddle) to charge your payment method for the subscription fee plus applicable taxes on a recurring monthly basis until you cancel. You are responsible for keeping your payment information current.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">4. No Refunds Policy</Title>
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                        All subscription payments are final and non-refundable.
                    </Alert>
                    <Text mb="sm">
                        Due to the digital nature of our service and the immediate access provided upon payment:
                    </Text>
                    <List>
                        <List.Item>We do not offer refunds for any subscription payments</List.Item>
                        <List.Item>Partial refunds for unused portions of a billing period are not available</List.Item>
                        <List.Item>This applies to both monthly renewals and any other charges</List.Item>
                        <List.Item>Failure to use the service does not entitle you to a refund</List.Item>
                    </List>
                    <Text mt="sm" size="sm" c="dimmed">
                        This policy exists because digital services cannot be &quot;returned&quot; once access has been provided.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">5. Cancellation</Title>
                    <Text mb="sm">
                        When you cancel your subscription:
                    </Text>
                    <List>
                        <List.Item>You will retain full access to HomeCoreOS until the end of your current billing period</List.Item>
                        <List.Item>No further charges will be made after cancellation takes effect</List.Item>
                        <List.Item>Cancellation does not entitle you to a refund for the current billing period</List.Item>
                        <List.Item>Your data will be retained for 30 days after your subscription ends, after which it may be permanently deleted</List.Item>
                        <List.Item>You may reactivate your subscription at any time before your data is deleted</List.Item>
                    </List>
                    <Text mt="sm">
                        To cancel your subscription, go to your account settings or contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">6. Exceptional Circumstances</Title>
                    <Text>
                        While our standard policy is no refunds, we may consider exceptions solely at our discretion in cases of:
                    </Text>
                    <List>
                        <List.Item>Duplicate charges due to documented technical errors on our end</List.Item>
                        <List.Item>Extended service outages (exceeding 72 consecutive hours) that significantly impacted your use</List.Item>
                        <List.Item>Billing errors that resulted in incorrect charges</List.Item>
                        <List.Item>Other extraordinary circumstances as determined by HomeCoreOS in its sole discretion</List.Item>
                    </List>
                    <Text mt="sm">
                        If you believe you qualify for an exception, please contact us within 30 days of the charge with details of your situation. We will review your request but are under no obligation to grant exceptions.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">7. Payment Disputes & Chargebacks</Title>
                    <Text mb="sm">
                        If you have concerns about a charge, please contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>{' '}
                        <strong>before</strong> initiating a dispute with your bank or payment provider. We are happy to review any billing concerns and work towards a resolution.
                    </Text>
                    <Alert icon={<IconAlertTriangle size={16} />} color="yellow" mt="md" mb="md">
                        <Text fw={600} mb="xs">Unauthorized Chargebacks</Text>
                        <Text size="sm">
                            If you initiate a chargeback or payment dispute with your bank without first attempting to resolve the issue with us, or if a chargeback is filed fraudulently:
                        </Text>
                    </Alert>
                    <List>
                        <List.Item>Your account will be immediately terminated and access to the service revoked</List.Item>
                        <List.Item>We reserve the right to recover the disputed amount plus any chargeback fees through collection efforts</List.Item>
                        <List.Item>We may report the incident to fraud prevention databases and services</List.Item>
                        <List.Item>Any outstanding balances will remain your responsibility</List.Item>
                        <List.Item>You may be prohibited from creating future accounts</List.Item>
                    </List>
                    <Text mt="sm" size="sm" c="dimmed">
                        Fraudulent chargebacks (where you received and used the service but claimed otherwise) may be considered theft of services and may result in legal action.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">8. Payment Processing</Title>
                    <Text>
                        Payments are processed by Paddle, our Merchant of Record. By making a purchase, you also agree to Paddle&apos;s{' '}
                        <Anchor href="https://www.paddle.com/legal/terms" target="_blank">Terms of Service</Anchor> and{' '}
                        <Anchor href="https://www.paddle.com/legal/privacy" target="_blank">Privacy Policy</Anchor>. Paddle handles all payment processing, invoicing, sales tax, and may require additional verification for fraud prevention purposes. Any payment-related inquiries may be directed to Paddle or to us.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">9. Currency and Taxes</Title>
                    <Text>
                        All prices are displayed in USD. Applicable sales tax, VAT, or other taxes will be added based on your location as determined by Paddle. The final charge to your payment method may vary due to currency conversion fees charged by your bank or payment provider, which are not within our control.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">10. Changes to This Policy</Title>
                    <Text>
                        We reserve the right to modify this Refund Policy at any time. Material changes will be communicated via email or through the service at least 30 days before taking effect. Your continued use of HomeCoreOS after changes constitutes acceptance of the updated policy.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">11. Contact Us</Title>
                    <Text>
                        If you have any questions about our refund policy or need assistance with billing, please contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>. We aim to respond to all inquiries within 2 business days.
                    </Text>
                </section>
            </Stack>
        </Container>
    );
}
