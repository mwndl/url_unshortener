# URL Unshortener API

The URL Unshortener API is an essential tool for expanding and validating short URLs to prevent potential security threats, such as accessing malicious websites or falling victim to phishing attempts. By integrating this API into your applications or services, you can ensure a safer browsing experience for your users.

## How it Works

To expand and verify a short URL, simply make a request to the URL Unshortener API endpoint with the shortened URL as a parameter. The API will then return the corresponding expanded URL, allowing you to inspect it for legitimacy before navigating to the destination.

### Example Request

```http
GET https://yourservice.com/?url=mxmt.ch/t/2545492
```

### Example Response

```json
{
    "url": "https://www.musixmatch.com/lyrics/The-Killers/Mr-Brightside",
    "execute_time": "0.13900",
    "token": "public",
    "description": "URL processed successfully."
}
```

Please note that if a token is not provided, the service will limit access to 100 requests per hour. To use a token, simply add a 'token' parameter to the URL and add a token defined in the code as a value.

### Example Request
```http
GET https://yourservice.com/?url=mxmt.ch/t/2545492&token=<YOUR_TOKEN_HERE>
```
