import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const App = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('');
  const [monthlyPaymentsSubscriptionId, setMonthlyPaymentsSubscriptionId] = useState('');
  const [response, setResponse] = useState('');
  const [planName, setPlanName] = useState("Eran");
  const [planPrice, setPlanPrice] = useState(500);
  const [isBluesnapLoaded, setIsBluesnapLoaded] = useState(false);

  useEffect(() => {
    // Check if BlueSnap SDK is loaded
    const checkBluesnapLoaded = () => {
      if (window.bluesnap) {
        console.log("s",window.bluesnap)
        setIsBluesnapLoaded(true);
      } else {
        console.log("not loaded")
        setTimeout(checkBluesnapLoaded, 100);
      }
    };
    checkBluesnapLoaded();
    
    updatePlansList();
  }, []);

  const updatePlansList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders() });
      const data = response.data;
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
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
      const response = await axios.post(`${API_BASE_URL}/plans`, request, { headers: getAuthHeaders() });
      const data = response.data;
      setResponse(data);
      setPlans([data, ...plans]);

      updatePlansList();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();

    try {
      const tokenResponse = await axios.post('https://sandbox.bluesnap.com/services/2/payment-fields-tokens', {}, { headers: getAuthHeaders() });
      const paymentToken = tokenResponse.data.token;

      if (isBluesnapLoaded) {
        window.bluesnap.securedPaymentCollectorSetup(paymentToken, function (sdkResponse) {
          if (sdkResponse.code === 1) {
            const encryptedData = sdkResponse.token;

            const request = {
              "payerInfo": {
                "zip": 102453,
                "firstName": "John",
                "lastName": "Doe",
                "phone": 1234567890
              },
              "paymentSource": {
                "creditCardInfo": {
                  "encryptedCardData": encryptedData
                }
              },
              "planId": subscriptionPlanId,
              "transactionFraudInfo": {
                "fraudSessionId": 1234,
                "customerId": 121341,
                "customerCreationDate": "2025-08-05"
              }
            };

            createSubscription(request);

          } else {
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
      const response = await axios.post(`${API_BASE_URL}/subscriptions`, request, { headers: getAuthHeaders() });
      const data = response.data;
      setResponse(data);
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleGetAllPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders() });
      const data = response.data;
      setPlans(data.plans);
    } catch (error) {
      console.error('Error getting all plans:', error);
    }
  };

  const handleGetMonthlyPayments = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/${monthlyPaymentsSubscriptionId}/payments`, { headers: getAuthHeaders() });
      const data = response.data;
      setResponse(data);
    } catch (error) {
      console.error('Error getting monthly payments:', error);
    }
  };

  return (
    <div className="App">
      <h1>BlueSnap Client</h1>
      <h2>Create Plan</h2>
      <form onSubmit={handleCreatePlan}>
        <input type="text" name="planName" placeholder="Plan Name" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
        <input type="number" name="planPrice" placeholder="Plan Price" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} required />
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
