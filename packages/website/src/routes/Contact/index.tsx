import React, { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  CircularProgress,
  Theme,
  Divider,
} from '@mui/material';
import { WithStyles } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import { motion } from 'framer-motion';

import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import NavBar from 'common/NavBar';

interface FormFields {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

function Contact({ classes }: ContactProps) {
  const [formData, setFormData] = useState<FormFields>({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const tempErrors: Partial<FormFields> = {};
    if (!formData.fullName.trim()) tempErrors.fullName = 'Full Name is required.';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email Address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email Address is invalid.';
    }
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required.';
    if (!formData.message.trim()) tempErrors.message = 'Message is required.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        subject: '',
        message: '',
      });
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  const scrollToForm = () => {
    const element = document.getElementById('contact-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <>
      <NavBar searchLocation={false} />
      <div className={classes.bgWrapper}>
        <Container className={classes.root} maxWidth="lg">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box className={classes.hero}>
              <Typography variant="h3" className={classes.heroTitle}>
                Contact Us
              </Typography>
              <Typography variant="h6" className={classes.heroSubtitle}>
                Have questions, feedback, or collaboration ideas? We&apos;d love to hear from you. Connect with the AquaticAI team for support, ocean data inquiries, or project collaborations.
              </Typography>
            </Box>
          </motion.div>

          {/* Two Column Layout */}
          <Grid container spacing={4} id="contact-form-section">
            
            {/* Left Column: Glass Info Cards */}
            <Grid item xs={12} md={5}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className={classes.columnWrapper}
              >
                <motion.div variants={itemVariants}>
                  <Card className={classes.glassCard}>
                    <CardContent className={classes.cardContent}>
                      <EmailIcon className={classes.icon} />
                      <Box>
                        <Typography className={classes.cardLabel}>Email</Typography>
                        <Typography className={classes.cardVal}>support@aquaticai.com</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className={classes.glassCard}>
                    <CardContent className={classes.cardContent}>
                      <PhoneIcon className={classes.icon} />
                      <Box>
                        <Typography className={classes.cardLabel}>Phone</Typography>
                        <Typography className={classes.cardVal}>+91 98765 43210</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className={classes.glassCard}>
                    <CardContent className={classes.cardContent}>
                      <LocationOnIcon className={classes.icon} />
                      <Box>
                        <Typography className={classes.cardLabel}>Location</Typography>
                        <Typography className={classes.cardVal}>Tamil Nadu, India</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className={classes.glassCard}>
                    <CardContent className={classes.cardContent}>
                      <AccessTimeIcon className={classes.icon} />
                      <Box>
                        <Typography className={classes.cardLabel}>Support Hours</Typography>
                        <Typography className={classes.cardVal}>Monday – Friday</Typography>
                        <Typography variant="body2" className={classes.cardSubVal}>
                          9:00 AM – 6:00 PM (IST)
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Follow Us links */}
                <motion.div variants={itemVariants} className={classes.followBox}>
                  <Typography className={classes.followTitle}>Follow Us</Typography>
                  <Box display="flex" gap="1rem" mt={1}>
                    <IconButton
                      component="a"
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.socialButton}
                    >
                      <GitHubIcon />
                    </IconButton>
                    <IconButton
                      component="a"
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.socialButton}
                    >
                      <LinkedInIcon />
                    </IconButton>
                    <IconButton
                      component="a"
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.socialButton}
                    >
                      <TwitterIcon />
                    </IconButton>
                  </Box>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Right Column: Form Panel */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className={classes.glassFormCard}>
                  <CardContent className={classes.formContent}>
                    <Typography variant="h5" className={classes.formTitle}>
                      Send a Message
                    </Typography>
                    
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={classes.successAlert}
                      >
                        Message sent successfully! We will get back to you shortly.
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            name="fullName"
                            label="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            error={Boolean(errors.fullName)}
                            helperText={errors.fullName}
                            fullWidth
                            variant="outlined"
                            slotProps={{
                              inputLabel: { className: classes.inputLabel },
                              htmlInput: { className: classes.inputValue }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            name="email"
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            fullWidth
                            variant="outlined"
                            slotProps={{
                              inputLabel: { className: classes.inputLabel },
                              htmlInput: { className: classes.inputValue }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            name="subject"
                            label="Subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            error={Boolean(errors.subject)}
                            helperText={errors.subject}
                            fullWidth
                            variant="outlined"
                            slotProps={{
                              inputLabel: { className: classes.inputLabel },
                              htmlInput: { className: classes.inputValue }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            name="message"
                            label="Message"
                            multiline
                            rows={4}
                            value={formData.message}
                            onChange={handleInputChange}
                            error={Boolean(errors.message)}
                            helperText={errors.message}
                            fullWidth
                            variant="outlined"
                            slotProps={{
                              inputLabel: { className: classes.inputLabel },
                              htmlInput: { className: classes.inputValue }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            className={classes.submitBtn}
                            fullWidth
                          >
                            {loading ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              'Send Message'
                            )}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* FAQ Section */}
          <Box className={classes.faqSection}>
            <Typography variant="h4" className={classes.faqHeader}>
              Frequently Asked Questions
            </Typography>

            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon className={classes.accordionIcon} />}>
                <Typography className={classes.accordionTitle}>What is AquaticAI?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography className={classes.accordionText}>
                  AquaticAI is an advanced ocean intelligence and visualization platform designed to discover, track, and analyze global ocean data and ARGO float telemetry.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon className={classes.accordionIcon} />}>
                <Typography className={classes.accordionTitle}>What data does AquaticAI provide?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography className={classes.accordionText}>
                  Our platform aggregates real-time measurements from active ARGO profiling floats, sensors, and satellites. This includes Sea Surface Temperature (SST), salinity, pressure, depth, wind speed, wave height, chlorophyll levels, and dissolved oxygen concentrations.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon className={classes.accordionIcon} />}>
                <Typography className={classes.accordionTitle}>How can I report a problem?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography className={classes.accordionText}>
                  You can submit a detailed report using the contact form above, or write directly to our support team at support@aquaticai.com. We aim to respond within 24–48 hours.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion className={classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon className={classes.accordionIcon} />}>
                <Typography className={classes.accordionTitle}>Can I contribute to the project?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography className={classes.accordionText}>
                  Yes, absolutely! AquaticAI is a completely open-source project. Developers, oceanographers, and conservationists can access our code repositories on GitHub and submit pull requests or feature ideas.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Call to Action Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Box className={classes.ctaSection}>
              <Typography variant="h4" className={classes.ctaHeader}>
                Let&apos;s Build a Smarter Ocean Together
              </Typography>
              <Typography className={classes.ctaText}>
                Your questions, ideas, and feedback help us improve AquaticAI and make ocean data more accessible through AI.
              </Typography>
              <Button
                variant="contained"
                onClick={scrollToForm}
                className={classes.ctaButton}
              >
                Contact Our Team
              </Button>
            </Box>
          </motion.div>
        </Container>

        {/* Bespoke Footer */}
        <Box className={classes.footer}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" className={classes.footerLogo}>
                  AquaticAI
                </Typography>
                <Typography className={classes.footerText}>
                  Pioneering marine intelligence and oceanographic discovery tools for scientists and front-line conservationists globally.
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} className={classes.footerLinksColumn}>
                <Typography variant="subtitle1" className={classes.footerHeader}>
                  Quick Links
                </Typography>
                <Box display="flex" flexDirection="column" gap="0.5rem" mt={1}>
                  <a href="/" className={classes.footerLink}>Home</a>
                  <a href="/map" className={classes.footerLink}>Map</a>
                  <a href="/about" className={classes.footerLink}>About</a>
                  <a href="/contact" className={classes.footerLink}>Contact</a>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle1" className={classes.footerHeader}>
                  Contact Us
                </Typography>
                <Typography className={classes.footerText} style={{ marginTop: '0.5rem' }}>
                  support@aquaticai.com<br />
                  Tamil Nadu, India
                </Typography>
                <Box display="flex" gap="0.75rem" mt={2}>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={classes.footerIconLink}><GitHubIcon /></a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={classes.footerIconLink}><LinkedInIcon /></a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={classes.footerIconLink}><TwitterIcon /></a>
                </Box>
              </Grid>
            </Grid>
            <Divider style={{ margin: '2rem 0 1.5rem', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Typography variant="body2" className={classes.copyrightText}>
              Copyright &copy; 2026 AquaticAI. All Rights Reserved.
            </Typography>
          </Container>
        </Box>
      </div>
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    bgWrapper: {
      minHeight: '100vh',
      backgroundColor: '#061E37', // Deep Ocean background color
      backgroundImage: 'linear-gradient(135deg, #061E37 0%, #0A2D54 50%, #0D3E73 100%)',
      color: '#FFFFFF',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    },
    root: {
      paddingTop: '3rem',
      paddingBottom: '4rem',
    },
    hero: {
      textAlign: 'center',
      marginBottom: '4rem',
      maxWidth: '800px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    heroTitle: {
      fontWeight: 700,
      color: '#FFFFFF',
      marginBottom: '1rem',
      textShadow: '0 4px 10px rgba(0,0,0,0.3)',
    },
    heroSubtitle: {
      fontWeight: 300,
      color: '#E0E7FF',
      lineHeight: 1.6,
    },
    columnWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    glassCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      color: '#FFFFFF',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 77, 64, 0.25)',
      },
    },
    cardContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      padding: '1.25rem !important',
    },
    icon: {
      fontSize: '2.25rem',
      color: '#a2e8dd', // Seafoam teal color accent
    },
    cardLabel: {
      fontWeight: 'bold',
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      color: '#a2e8dd',
      letterSpacing: 0.5,
    },
    cardVal: {
      fontWeight: 500,
      fontSize: '1.05rem',
    },
    cardSubVal: {
      color: '#CBD5E1',
      fontSize: '0.9rem',
    },
    followBox: {
      marginTop: '1.5rem',
      paddingLeft: '0.5rem',
    },
    followTitle: {
      fontWeight: 'bold',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      color: '#E2E8F0',
      letterSpacing: 0.5,
    },
    socialButton: {
      color: '#FFFFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      transition: 'background-color 0.2s, color 0.2s',
      '&:hover': {
        backgroundColor: '#a2e8dd',
        color: '#061E37',
      },
    },
    glassFormCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      color: '#FFFFFF',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    },
    formContent: {
      padding: '2.5rem !important',
    },
    formTitle: {
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#FFFFFF',
      borderBottom: '2px solid rgba(162, 232, 221, 0.2)',
      paddingBottom: '0.5rem',
    },
    inputLabel: {
      color: '#a2e8dd !important',
      fontWeight: 500,
    },
    inputValue: {
      color: '#FFFFFF !important',
    },
    successAlert: {
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      border: '1px solid #4caf50',
      color: '#81c784',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontSize: '0.95rem',
      fontWeight: 500,
    },
    submitBtn: {
      height: '48px',
      fontWeight: 'bold',
      textTransform: 'none',
      fontSize: '1rem',
      backgroundColor: '#a2e8dd',
      color: '#061E37',
      borderRadius: '30px',
      transition: 'transform 0.2s, background-color 0.2s',
      '&:hover': {
        backgroundColor: '#7ad1c2',
        transform: 'scale(1.02)',
      },
    },
    faqSection: {
      marginTop: '5rem',
    },
    faqHeader: {
      fontWeight: 600,
      textAlign: 'center',
      marginBottom: '2.5rem',
    },
    accordion: {
      backgroundColor: 'rgba(255, 255, 255, 0.04) !important',
      border: '1px solid rgba(255, 255, 255, 0.08) !important',
      borderRadius: '8px !important',
      marginBottom: '1rem',
      color: '#FFFFFF !important',
      boxShadow: 'none !important',
      '&:before': {
        display: 'none',
      },
    },
    accordionIcon: {
      color: '#a2e8dd',
    },
    accordionTitle: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    accordionText: {
      color: '#E2E8F0',
      lineHeight: 1.6,
      fontSize: '0.95rem',
    },
    ctaSection: {
      marginTop: '5rem',
      padding: '3rem 2rem',
      borderRadius: '16px',
      backgroundImage: 'linear-gradient(135deg, rgba(162, 232, 221, 0.15) 0%, rgba(13, 62, 115, 0.4) 100%)',
      border: '1px solid rgba(162, 232, 221, 0.2)',
      textAlign: 'center',
    },
    ctaHeader: {
      fontWeight: 700,
      marginBottom: '1rem',
    },
    ctaText: {
      color: '#E2E8F0',
      marginBottom: '2rem',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      lineHeight: 1.6,
    },
    ctaButton: {
      backgroundColor: '#a2e8dd',
      color: '#061E37',
      fontWeight: 'bold',
      textTransform: 'none',
      borderRadius: '30px',
      padding: '0.75rem 2rem',
      '&:hover': {
        backgroundColor: '#7ad1c2',
      },
    },
    footer: {
      marginTop: '6rem',
      padding: '4rem 0 2rem',
      backgroundColor: '#041527',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    },
    footerLogo: {
      fontWeight: 700,
      color: '#FFFFFF',
      marginBottom: '1rem',
      letterSpacing: 0.5,
    },
    footerText: {
      color: '#94A3B8',
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    footerHeader: {
      fontWeight: 'bold',
      color: '#a2e8dd',
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: 0.5,
    },
    footerLinksColumn: {
      '@media (max-width: 600px)': {
        display: 'none',
      },
    },
    footerLink: {
      color: '#94A3B8',
      textDecoration: 'none',
      fontSize: '0.9rem',
      transition: 'color 0.2s',
      '&:hover': {
        color: '#a2e8dd',
      },
    },
    footerIconLink: {
      color: '#94A3B8',
      transition: 'color 0.2s',
      '&:hover': {
        color: '#a2e8dd',
      },
    },
    copyrightText: {
      textAlign: 'center',
      color: '#64748B',
      fontSize: '0.85rem',
    },
  });

interface ContactProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(Contact);
