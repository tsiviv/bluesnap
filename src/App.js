import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Modal from './Modal';


const App = () => {
  const [plans, setPlans] = useState([]);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('');
  const [response, setResponse] = useState('');
  const [planName, setPlanName] = useState("Eran");
  const [planPrice, setPlanPrice] = useState(1);
  const [isBluesnapLoaded, setIsBluesnapLoaded] = useState(false);
  const submitPaymentButtonRef = useRef(null);
  const [monthlyPaymentsSubscriptionId, setMonthlyPaymentsSubscriptionId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = (request) => {
    setIsModalOpen(false);
    if (request) {
      console.log(request);
      createSubscription(request);
    }
  };
  const axiosInstance = axios.create({
    baseURL: 'https://localhost:443/api', // Replace with your server's base URL
    timeout: 5000, // Timeout in milliseconds
    withCredentials: true, // Include cookies in CORS requests
    
  });
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

 
  const updatePlansList = async () => {
    try {
      const response = await axiosInstance.get(`/plans`, { headers: getAuthHeaders(), withCredentials: true });
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const createSubscription = async (request) => {
    console.log("createSubscription", request, subscriptionPlanId);
    try {
      const response = await axiosInstance.post(`/subscriptions`, request, { headers: getAuthHeaders(), withCredentials: true });
      setResponse(response.data);
    } catch (error) {
      console.error('Error creating subscription:', error);
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
      const response = await axiosInstance.post(`/plans`, request, { headers: getAuthHeaders(), withCredentials: true });
      setResponse(response.data);
      setPlans([...plans, response.data]);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleGetAllPlans = async () => {
    try {
      const response = await axiosInstance.get(`/plans`, { headers: getAuthHeaders(), withCredentials: true });
    } catch (error) {
      console.error('Error getting all plans:', error);
    }
  };

  const handleGetMonthlyPayments = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.get(`/subscriptions/${monthlyPaymentsSubscriptionId}/payments`, { headers: getAuthHeaders(), withCredentials: true });
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
      <form>
        <label htmlFor="subscriptionPlan">Select Plan:</label>
        <select id="subscriptionPlan" value={subscriptionPlanId} onChange={(e) => setSubscriptionPlanId(e.target.value)}>
          <option value="">Select a plan</option>
          {plans?.map(plan => (
            <option key={plan.planId} value={plan.planId}>{plan.name}</option>
          ))}
        </select>
        <br />
      </form>
      {subscriptionPlanId && <button onClick={openModal}>Open Payment Form</button>}
      <Modal isOpen={isModalOpen} closeModal={closeModal} subscriptionPlanId={subscriptionPlanId} isBluesnapLoaded={isBluesnapLoaded} />
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
