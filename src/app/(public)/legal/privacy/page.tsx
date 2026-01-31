'use client';

import { Container, Title, Text, Stack, Divider, List, Anchor, Table } from '@mantine/core';

export default function PrivacyPolicyPage() {
    const lastUpdated = 'January 31, 2026';
    const version = '1.1';
    const contactEmail = 'feldenserra@proton.me';

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <div>
                    <Title order={1}>Privacy Policy</Title>
                    <Text c="dimmed" size="sm" mt="xs">Last Updated: {lastUpdated} | Version: {version}</Text>
                </div>

                <Text>
                    HomeCoreOS (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
                </Text>

                <Divider />

                <section>
                    <Title order={2} size="h3" mb="sm">1. Information We Collect</Title>
                    <Text mb="sm">
                        We collect information that you provide directly to us when using HomeCoreOS:
                    </Text>
                    <Title order={3} size="h4" mb="xs" mt="md">Account Information</Title>
                    <List>
                        <List.Item>Email address</List.Item>
                        <List.Item>Name (if provided)</List.Item>
                        <List.Item>Account preferences and settings</List.Item>
                    </List>
                    <Title order={3} size="h4" mb="xs" mt="md">User Content</Title>
                    <List>
                        <List.Item>Recipes and cooking notes</List.Item>
                        <List.Item>Tasks and to-do items</List.Item>
                        <List.Item>Meal plans and schedules</List.Item>
                        <List.Item>Any other content you create within the app</List.Item>
                    </List>
                    <Title order={3} size="h4" mb="xs" mt="md">Usage Information</Title>
                    <List>
                        <List.Item>Log data (IP address, browser type, access times)</List.Item>
                        <List.Item>Device information</List.Item>
                        <List.Item>Pages visited and features used</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">2. How We Use Your Information</Title>
                    <Text mb="sm">
                        We use the information we collect to:
                    </Text>
                    <List>
                        <List.Item>Provide, maintain, and improve HomeCoreOS</List.Item>
                        <List.Item>Process your subscription and payments</List.Item>
                        <List.Item>Send you important updates about the service</List.Item>
                        <List.Item>Respond to your questions and support requests</List.Item>
                        <List.Item>Monitor and analyze usage patterns to improve user experience</List.Item>
                        <List.Item>Protect against fraud and unauthorized access</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">3. Legal Basis for Processing (EU/EEA Users)</Title>
                    <Text mb="sm">
                        For users in the European Union or European Economic Area, we process your personal data based on the following legal grounds:
                    </Text>
                    <List>
                        <List.Item><strong>Contract:</strong> To provide our service to you pursuant to our Terms of Service</List.Item>
                        <List.Item><strong>Legitimate Interests:</strong> To improve our service, ensure security, and prevent fraud</List.Item>
                        <List.Item><strong>Consent:</strong> For marketing communications (where applicable)</List.Item>
                        <List.Item><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">4. Data Sharing</Title>
                    <Text fw={600} mb="xs">We do not sell your personal data.</Text>
                    <Text mb="sm">
                        We only share your information with third parties in the following circumstances:
                    </Text>
                    <List>
                        <List.Item><strong>Service Providers:</strong> We use trusted third-party services to operate HomeCoreOS (see Section 5)</List.Item>
                        <List.Item><strong>Legal Requirements:</strong> We may disclose information if required by law, subpoena, or court order, or to protect our legal rights</List.Item>
                        <List.Item><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new entity with notice provided to you</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">5. Third-Party Services</Title>
                    <Text mb="sm">
                        We use the following third-party services to provide HomeCoreOS:
                    </Text>
                    <Table mb="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Service</Table.Th>
                                <Table.Th>Purpose</Table.Th>
                                <Table.Th>Privacy Policy</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td>Supabase</Table.Td>
                                <Table.Td>Database, authentication, and storage</Table.Td>
                                <Table.Td><Anchor href="https://supabase.com/privacy" target="_blank">View Policy</Anchor></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>Paddle</Table.Td>
                                <Table.Td>Payment processing (Merchant of Record)</Table.Td>
                                <Table.Td><Anchor href="https://www.paddle.com/legal/privacy" target="_blank">View Policy</Anchor></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>Vercel</Table.Td>
                                <Table.Td>Web hosting and analytics</Table.Td>
                                <Table.Td><Anchor href="https://vercel.com/legal/privacy-policy" target="_blank">View Policy</Anchor></Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                    <Text size="sm" c="dimmed">
                        These services have their own privacy policies governing their use of your data. We require our service providers to protect your data consistent with this policy.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">6. International Data Transfers</Title>
                    <Text>
                        Your information may be transferred to and processed in countries other than your country of residence, including the United States. These countries may have different data protection laws than your country. By using HomeCoreOS, you consent to such transfers. We ensure appropriate safeguards are in place with our service providers to protect your data in compliance with applicable law.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">7. Data Security</Title>
                    <Text>
                        We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include encryption in transit and at rest, secure authentication, and regular security assessments. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">8. Data Retention</Title>
                    <Text>
                        We retain your personal data for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal, tax, or regulatory purposes. Anonymized or aggregated data may be retained indefinitely for analytics purposes.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">9. Your Rights</Title>
                    <Text mb="sm">
                        Depending on your location, you may have the following rights regarding your personal data:
                    </Text>
                    <List>
                        <List.Item><strong>Access:</strong> Request a copy of your personal data</List.Item>
                        <List.Item><strong>Correction:</strong> Request correction of inaccurate data</List.Item>
                        <List.Item><strong>Deletion:</strong> Request deletion of your personal data</List.Item>
                        <List.Item><strong>Export:</strong> Request your data in a portable format</List.Item>
                        <List.Item><strong>Restriction:</strong> Request restriction of processing in certain circumstances</List.Item>
                        <List.Item><strong>Objection:</strong> Object to processing based on legitimate interests</List.Item>
                        <List.Item><strong>Opt-out:</strong> Opt out of marketing communications</List.Item>
                    </List>
                    <Text mt="sm">
                        To exercise any of these rights, please contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>. We will respond to your request within 30 days.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">10. California Privacy Rights (CCPA)</Title>
                    <Text mb="sm">
                        If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
                    </Text>
                    <List>
                        <List.Item><strong>Right to Know:</strong> Request disclosure of personal information we collected, used, and disclosed about you</List.Item>
                        <List.Item><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions</List.Item>
                        <List.Item><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (note: we do not sell your personal information)</List.Item>
                        <List.Item><strong>Right to Non-Discrimination:</strong> Exercise your rights without discriminatory treatment</List.Item>
                    </List>
                    <Text mt="sm">
                        To exercise your California privacy rights, contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">11. Cookies and Tracking</Title>
                    <Text mb="sm">
                        We use the following types of cookies:
                    </Text>
                    <List>
                        <List.Item><strong>Essential Cookies:</strong> Required for authentication, session management, and core functionality. These cannot be disabled.</List.Item>
                        <List.Item><strong>Analytics Cookies:</strong> Vercel Analytics collects anonymized usage data to help us understand how users interact with our service.</List.Item>
                    </List>
                    <Text mt="sm">
                        You can control non-essential cookies through your browser settings. Disabling essential cookies may prevent you from using the service properly.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">12. Children&apos;s Privacy</Title>
                    <Text>
                        HomeCoreOS is not intended for children under 13 years of age (or 16 in the EEA). We do not knowingly collect personal data from children under these ages. If you believe we have collected data from a child, please contact us immediately and we will promptly delete such information.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">13. Changes to This Policy</Title>
                    <Text>
                        We may update this Privacy Policy from time to time. We will notify you of material changes via email or through a prominent notice on the service at least 30 days before the changes take effect. Your continued use of HomeCoreOS after changes constitutes acceptance of the updated policy. We encourage you to review this policy periodically.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">14. Governing Law</Title>
                    <Text>
                        This Privacy Policy shall be governed by and construed in accordance with the laws of the State of Nevada, United States, without regard to its conflict of law provisions.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">15. Contact Us</Title>
                    <Text>
                        If you have any questions about this Privacy Policy, our data practices, or wish to exercise your privacy rights, please contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>.
                    </Text>
                </section>
            </Stack>
        </Container>
    );
}
