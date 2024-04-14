import axios from 'axios';
import React, { useState } from 'react';
import * as yup from 'yup';

const validationErrors = {
  fullNameTooShort: 'Full name must be at least 3 characters',
  fullNameTooLong: 'Full name must be at most 20 characters',
  sizeIncorrect: 'Size must be S or M or L'
};

const validationSchema = yup.object().shape({
  fullName: yup.string()
    .min(3, validationErrors.fullNameTooShort)
    .max(20, validationErrors.fullNameTooLong)
    .required('Full name is required'),
  size: yup.string()
    .matches(/^[SML]$/, validationErrors.sizeIncorrect)
    .required('Size is required'),
});

const toppings = [
  { topping_id: '1', text: 'Pepperoni' },
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' },
];

function Form() {
  const [formData, setFormData] = useState({
    fullName: '',
    size: '',
    toppings: [],
  });
  const [errors, setErrors] = useState({});
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const validateField = async (fieldName, value) => {
    try {
      await yup.reach(validationSchema, fieldName).validate(value);
      setErrors({ ...errors, [fieldName]: '' });
    } catch (error) {
      setErrors({ ...errors, [fieldName]: error.message });
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'fullName' || name === 'size') {
      validateField(name, value);
    }

    if (type === 'checkbox' && name === 'toppings') {
      let newToppings;
      if (checked) {
        newToppings = [...formData.toppings, parseInt(value)];
      } else {
        newToppings = formData.toppings.filter(topping_id => topping_id !== parseInt(value));
      }
      setFormData({ ...formData, [name]: newToppings });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      const response = await submitFormData(formData);
      setSubmissionSuccess(true);
      setSubmissionError(false);
      setFormData({ fullName: '', size: '', toppings: [] });
      setServerMessage(response.data.message);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        error.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        setErrors(validationErrors);
      } else {
        console.error('Form submission error:', error);
        setSubmissionError(true);
      }
      setSubmissionSuccess(false);
    }
  };

  const submitFormData = async (data) => {
    try {
      const response = await axios.post('http://localhost:9009/api/order', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 201) {
        return response;
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Order Your Pizza</h2>
      {submissionSuccess && <div className='success'>{serverMessage}</div>}
      {submissionError && <div className='failure'>Something went wrong</div>}

      <div className="input-group">
        <div>
          <label htmlFor="fullName">Full Name</label><br />
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
          />
          {errors.fullName && <div className='error'>{errors.fullName}</div>}
        </div>
      </div>

      <div className="input-group">
        <div>
          <label htmlFor="size">Size</label><br />
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
          >
            <option value="">----Choose Size----</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
          {errors.size && <div className='error'>{errors.size}</div>}
        </div>
      </div>

      <div className="input-group">
        {toppings.map(topping => (
          <label key={topping.topping_id}>
            <input
              name="toppings"
              type="checkbox"
              value={`${topping.topping_id}`}
              checked={formData.toppings.includes(parseInt(topping.topping_id))}
              onChange={handleChange}
            />
            {topping.text}<br />
          </label>
        ))}
      </div>

      <input type="submit" disabled={!formData.fullName || !formData.size} />
    </form>
  );
}

export default Form;
