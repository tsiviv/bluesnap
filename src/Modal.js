import React, { useState, useEffect, useRef } from 'react';
import './Modal.css'; // Make sure to create a CSS file to style your modal
import Cookies from 'js-cookie';
import axios from 'axios';

const Modal = ({ isOpen, closeModal, children,subscriptionPlanId,isBluesnapLoaded }) => {
//   if (!isOpen) return null;
  const API_BASE_URL = 'http://localhost:8080/api'; // Ensure this matches your server's address
  const [hostedPaymentFieldsToken, setHostedPaymentFieldsToken] = useState('');
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
    if (isOpen) {
        console.log(subscriptionPlanId)
      handleCreateSubscription();
    }
  }, [isOpen]);
  const handleCreateSubscription = async () => {
   

    try {
      // Step 1: Obtain the Hosted Payment Fields Token
      const tokenResponse = await axios.post(`${API_BASE_URL}/token`, {}, { headers: getAuthHeaders() });
      const locationHeader = tokenResponse.data.tokenLocation;
      const hostedFieldTokenId = locationHeader.split('/').pop();
      setHostedPaymentFieldsToken(hostedFieldTokenId);

      // Step 2: Check if Bluesnap SDK is loaded
      if (isBluesnapLoaded && window.bluesnap) {
        // Step 3: Set up secured payment collection with Bluesnap SDK
        console.log(hostedFieldTokenId)
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
              console.error('error  ' + tagId + ': ' + JSON.stringify(error));
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

  const handleSubmitPayment = (e) => {
    e.preventDefault()
    console.log("handleSubmitPayment")
    if (window.bluesnap && window.bluesnap.hostedPaymentFieldsSubmitData) {
      window.bluesnap.hostedPaymentFieldsSubmitData((submitResponse) => {
        console.log('Submission callback executed');
        
        if (submitResponse.transactionFraudInfo) {
          console.log(submitResponse.transactionFraudInfo)
          const encryptedData = submitResponse.transactionFraudInfo.fraudSessionId;
          console.log('Encrypted card data:', encryptedData);
  
          // Prepare request object to create subscription or process payment
          const request = {
            payerInfo: {
              zip: 102453,
              firstName: 'John',
              lastName: 'Doe',
              phone: 1234567890
            },
            paymentSource: {
              creditCardInfo: {
                pfToken: hostedPaymentFieldsToken
              }
            },
            planId: subscriptionPlanId, // Replace with your subscription plan ID
            transactionFraudInfo: {
              fraudSessionId: 1234,
              customerId: 121341,
              customerCreationDate: '2025-08-05'
            }
          };
  
          // Call function to create subscription or process payment using the prepared request
          closeModal(request)
        //   createSubscription(request);
        } else {
          console.error('Card data not received from SDK');
        }
      }, (error) => {
        console.error('submitData error:', error); // Log any errors
      });
    } else {
      console.error('Bluesnap SDK is not loaded or function not available');
    }
  };
  if (!isOpen) {
    return null; // Return null if isOpen is false to exit the component
  }
  return (
    <div className="modal-overlay">
      <div className="modal-content">
      <form onSubmit={handleSubmitPayment}>
        <div data-bluesnap="ccn"></div>
        <div data-bluesnap="exp"></div>
        <div data-bluesnap="cvv"></div>
        <button data-bluesnap="submitButton" type="submit" id="submit-button">Pay Now</button>
      </form>
        <button className="close-button" onClick={closeModal}>×</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
