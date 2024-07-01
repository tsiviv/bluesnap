import React, { useState, useEffect, useRef } from 'react';
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
  const submitPaymentButtonRef = useRef(null);

  const saveAuthDetailsToCookies = () => {
    const API_USERNAME = 'API_17193957133152076686385';
    const API_PASSWORD = 'P@ssword_Example1';
    Cookies.set('api_username', API_USERNAME, { expires: 7 });
    Cookies.set('api_password', API_PASSWORD, { expires: 7 });
  };

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
    const loadBluesnapSDK = async () => {
      const script = document.createElement('script');
      script.src = 'https://sandbox.bluesnap.com/web-sdk/latest/bluesnap.js';
      script.async = true;
      script.onload = () => {
        setIsBluesnapLoaded(true);
      };
      document.body.appendChild(script);
    };

    loadBluesnapSDK();
    updatePlansList();
  }, []);

  useEffect(() => {
    if (submitPaymentButtonRef.current) {
      submitPaymentButtonRef.current.addEventListener('click', handleSubmitPayment);
    }
    return () => {
      if (submitPaymentButtonRef.current) {
        submitPaymentButtonRef.current.removeEventListener('click', handleSubmitPayment);
      }
    };
  }, [isBluesnapLoaded]);

  const updatePlansList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders(), withCredentials: true });
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const newPlanName = e.target.elements.planName.value;
    const newPlanPrice = e.target.elements.planPrice.value;

    const request = {
      "chargeFrequency": "MONTHLY",
      "name": newPlanName,
      "currency": "USD",
      "recurringChargeAmount": newPlanPrice
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/plans`, request, { headers: getAuthHeaders(), withCredentials: true });
      setResponse(response.data);
      updatePlansList();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Obtain the Hosted Payment Fields Token
      const tokenResponse = await axios.post(`${API_BASE_URL}/token`, {}, { headers: getAuthHeaders() });
      const locationHeader = tokenResponse.data.tokenLocation;
      const hostedFieldTokenId = locationHeader.split('/').pop();
      setHostedPaymentFieldsToken(hostedFieldTokenId);

      // Step 2: Check if Bluesnap SDK is loaded
      if (isBluesnapLoaded && window.bluesnap) {
        // Step 3: Set up secured payment collection with Bluesnap SDK
          window.bluesnap.hostedPaymentFieldsCreate({
            token: hostedFieldTokenId,
            onFieldEventHandler: {
              onFocus: (tagId) => {
                console.log('focus ' + tagId);
              },
              onBlur: (tagId) => {
                console.log('blur ' + tagId);
              },
              onError: (tagId, error) => {
                console.error('error ' + tagId + ': ' + JSON.stringify(error));
              },
              onType: (tagId, inputData) => {
                console.log('type ' + tagId + ': ' + JSON.stringify(inputData));
              }
            },
            onError: (error) => {
              console.error('hostedPaymentFieldsCreate error: ' + JSON.stringify(error));
            }
          });
        
      } else {
        console.error('Bluesnap SDK is not loaded');
      }
    } catch (error) {
      console.error('Error obtaining payment token:', error);
    }
  };

  const handleSubmitPayment = () => {
    if (isBluesnapLoaded && window.bluesnap) {
      if (window.bluesnap.hostedPaymentFields) {
        window.bluesnap.hostedPaymentFields.submit((submitResponse) => {
          if (submitResponse.cardData) {
            const encryptedData = submitResponse.cardData.encryptedCardData;

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
            console.error('Card data not received from SDK');
          }
        }, (error) => {
          console.error('submitData error: ' + JSON.stringify(error));
        });
      } else {
        console.error('Bluesnap hostedPaymentFields is not available');
      }
    } else {
      console.error('Bluesnap SDK is not loaded');
    }
  };

  const createSubscription = async (request) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/subscriptions`, request, { headers: getAuthHeaders(), withCredentials: true });
      setResponse(response.data);
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleGetAllPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, { headers: getAuthHeaders(), withCredentials: true });
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error getting all plans:', error);
    }
  };

  const handleGetMonthlyPayments = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/${monthlyPaymentsSubscriptionId}/payments`, { headers: getAuthHeaders(), withCredentials: true });
      setResponse(response.data);
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
        <div data-bluesnap="ccn"></div>
        <div data-bluesnap="exp"></div>
        <div data-bluesnap="cvv"></div>
        <button type="submit">Create Subscription</button>
      </form>
      <button ref={submitPaymentButtonRef} id="submitPayment">Submit Payment</button>
      <h2>Get All Plans</h2>
      <button onClick={handleGetAllPlans}>Get All Plans</button>
      <h2>Get Monthly Payments</h2>
      <form onSubmit={handleGetMonthlyPayments}>
        <input type="text" value={monthlyPaymentsSubscriptionId} onChange={(e) => setMonthlyPaymentsSubscriptionId(e.target.value)} placeholder="Subscription ID" required />
        <button type="submit">Get Monthly Payments</button>
      </form>
      {response && <div>
        <h3>Response:</h3>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>}
    </div>
  );
};

export default App;
