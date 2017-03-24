import axios from 'axios'
import {api} from '../../config/client.index'

var instance = axios.create({
	baseURL:api.baseurl,
	transformRequest:[function(data){
        return JSON.stringify(data)
    }],
	headers:{
		'Content-Type' : 'application/json',
        'authentication' : ''
	},
	timeout:500
});

instance.interceptors.response.use(function (response) {
    // Do something with response data
    console.log('loaded!!');
    if(response.status == 200 && response.statusText == 'OK'){
    	return response.data
    }else{
    	return response;
    }
  }, function (error) {
    // Do something with response error
    return Promise.reject(error);
  });

module.exports = instance;