import axios from 'axios';


const api = axios.create({
    baseURL: '', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
});

export default api;