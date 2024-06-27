import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8080/api'; // Ensure this matches your server's address

const App = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('');
  const [monthlyPaymentsSubscriptionId, setMonthlyPaymentsSubscriptionId] = useState('');
  const [response, setResponse] = useState('');
  const [planName, setPlanName] = useState("Eran");
  const [planPrice, setPlanPrice] = useState(500);
  const [isBluesnapLoaded, setIsBluesnapLoaded] = useState(false);
  const [hostedPaymentFieldsToken, setHostedPaymentFieldsToken] = useState('');

  // Function to save auth details to cookies
  const saveAuthDetailsToCookies = () => {
    const API_USERNAME = 'API_17193957133152076686385';
    const API_PASSWORD = 'P@ssword_Example1';
    Cookies.set('api_username', API_USERNAME, { expires: 7 });
    Cookies.set('api_password', API_PASSWORD, { expires: 7 });
  };

  // Function to get auth headers
  const getAuthHeaders = () => {
    const API_USERNAME = Cookies.get('api_username');
    const API_PASSWORD = Cookies.get('api_password');
    const encodedCredentials = btoa(`${API_USERNAME}:${API_PASSWORD}`);
    return {
      'Authorization': `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  useEffect(() => {
    saveAuthDetailsToCookies();
    const checkBluesnapLoaded = () => {
      if (window.bluesnap) {
        setIsBluesnapLoaded(true);
      } else {
        setTimeout(checkBluesnapLoaded, 100);
      }
    };
    checkBluesnapLoaded();
    updatePlansList();
  }, []);

  const updatePlansList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders(), withCredentials: true });
      const data = response.data;
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const newPlanName = e.target.elements.planName.value;
    const newPlanPrice = e.target.elements.planPrice.value;
    
    if (planName !== newPlanName || planPrice !== newPlanPrice) {
      setPlanName(newPlanName);
      setPlanPrice(newPlanPrice);
    }
    
    const request = {
      "chargeFrequency": "MONTHLY",
      "name": newPlanName,
      "currency": "USD",
      "recurringChargeAmount": newPlanPrice
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/plans`, request, { headers: getAuthHeaders(), withCredentials: true });
      const data = response.data;
      setResponse(data);
      setPlans([data, ...plans]); // Update plans state

      updatePlansList();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Obtain Payment Token from BlueSnap (Server-side)
      const tokenResponse = await axios.post(`${API_BASE_URL}/token`, { headers: getAuthHeaders(), });

      // Extract the Hosted Payment Fields token from the Location header
      const locationHeader = tokenResponse.headers['location'];

      console.log(locationHeader)
      const hostedFieldTokenId = locationHeader.split('/').pop(); // Extract the token ID from the URL
      setHostedPaymentFieldsToken(hostedFieldTokenId);

      // Step 2: Ensure `bluesnap` is available in the global scope
      if (isBluesnapLoaded) {
        window.bluesnap.securedPaymentCollectorSetup(hostedFieldTokenId, function (sdkResponse) {
          if (sdkResponse.code === 1) {
            // Step 3: Data submission was a success
            // Extract encrypted credit card data from Secured Payment Collector
            const encryptedData = sdkResponse.token;

            // Step 4: Include encrypted credit card data in your subscription request
            const request = {
              "payerInfo": {
                "zip": 102453,
                "firstName": "John",
                "lastName": "Doe",
                "phone": 1234567890
              },
              "paymentSource": {
                "creditCardInfo": {
                  "encryptedCardData": encryptedData // Include encrypted credit card data here
                }
              },
              "planId": subscriptionPlanId,
              "transactionFraudInfo": {
                "fraudSessionId": 1234,
                "customerId": 121341,
                "customerCreationDate": "2025-08-05"
              }
            };

            // Step 5: Submit subscription request to your backend
            createSubscription(request);

          } else {
            // Handle errors or warnings
            const { errors, warnings } = sdkResponse.info;
            console.error('Payment submission error:', errors, warnings);
          }
        }, false);
      } else {
        console.error('Bluesnap SDK is not loaded');
      }
    } catch (error) {
      console.error('Error obtaining payment token:', error);
    }
  };

  const createSubscription = async (request) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscriptions`, request, { headers: getAuthHeaders(), withCredentials: true });
      const data = response.data;
      setResponse(data);
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleGetAllPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders(), withCredentials: true });
      const data = response.data;
      setPlans(data.plans);
    } catch (error) {
      console.error('Error getting all plans:', error);
    }
  };

  const handleGetMonthlyPayments = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/${monthlyPaymentsSubscriptionId}/payments`, { headers: getAuthHeaders(), withCredentials: true });
      const data = response.data;
      setResponse(data);
    } catch (error) {
      console.error('Error getting monthly payments:', error);
    }
  };

  return (
    <div className="App">
      <script type="text/javascript" src="https://sandbox.bluesnap.com/web-sdk/5/bluesnap.js"></script>

      <h1>BlueSnap Client</h1>
      <h2>Create Plan</h2>
      <form onSubmit={handleCreatePlan}>
        <input type="text" name="planName" placeholder="Plan Name" value={planName} required />
        <input type="number" name="planPrice" placeholder="Plan Price" value={planPrice} required />
        <button type="submit">Create Plan</button>
      </form>

      <h2>Create Subscription</h2>
      <form onSubmit={handleCreateSubscription}>
        <label htmlFor="subscriptionPlan">Select Plan:</label>
        <select id="subscriptionPlan" value={subscriptionPlanId} onChange={(e) => setSubscriptionPlanId(e.target.value)}>
          <option value="">Select a plan</option>
          {plans?.map(plan => (
            <option key={plan.id} value={plan.id}>{plan.name}</option>
          ))}
        </select>
        <button type="submit">Create Subscription</button>
      </form>

      <h2>Get All Plans</h2>
      <button onClick={handleGetAllPlans}>Get All Plans</button>

      <h2>Get Monthly Payments</h2>
      <form onSubmit={handleGetMonthlyPayments}>
        <input type="text" value={monthlyPaymentsSubscriptionId} onChange={(e) => setMonthlyPaymentsSubscriptionId(e.target.value)} placeholder="Subscription ID" required />
        <button type="submit">Get Monthly Payments</button>
      </form>

      <div id="response">
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    </div>
  );
};

export default App;
