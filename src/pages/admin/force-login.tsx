import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  Container,
  Divider,
  Paper,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Login as LoginIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

export default function DirectLogin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [credentials, setCredentials] = useState({
    email: 'codemaxon@gmail.com',
    password: 'admin123'
  });
  const router = useRouter();

  // Direct sign-in function with additional debugging
  const signInDirectly = async () => {
    try {
      setLoading(true);
      setError(null);
      setResponseData(null);
      
      if (debugMode) {
        console.log('Login request:', {
          email: credentials.email,
          password: credentials.password
        });
      }
      
      // Use the direct API call to Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        throw error;
      }

      // Save debug data
      if (debugMode) {
        setResponseData(data);
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
      
    } catch (err: any) {
      console.error('Direct login error:', err);
      setError(err.message || 'Error initiating session');
      
      if (debugMode) {
        setResponseData({error: err});
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  // Toggle password visibility
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ p: 4, borderRadius: 2, boxShadow: 5 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <LoginIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h5" component="h1" fontWeight="bold">
            Admin Direct Login
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" paragraph>
          This page allows direct login with admin credentials, bypassing the standard login page.
        </Typography>
        
        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
              Login successful! Redirecting to admin panel...
            </Alert>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={signInDirectly}
            disabled={loading || success}
            fullWidth
            size="large"
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In as Admin'}
          </Button>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              component={Link} 
              href="/login"
              sx={{ mr: 1 }}
            >
              Regular Login
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => setDebugMode(!debugMode)}
            >
              {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
            </Button>
          </Box>
        </Box>
        
        {/* Debug info */}
        {debugMode && responseData && (
          <Paper sx={{ p: 2, mt: 3, maxHeight: 300, overflow: 'auto', fontSize: '0.8rem' }}>
            <Typography variant="subtitle2" gutterBottom>
              Response data:
            </Typography>
            <pre>{JSON.stringify(responseData, null, 2)}</pre>
          </Paper>
        )}
        
        <Box mt={4}>
          <Alert severity="info">
            <Typography variant="body2">
              This page is for administrative use during system setup.
            </Typography>
          </Alert>
        </Box>
      </Card>
    </Container>
  );
}