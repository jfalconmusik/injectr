# injectr
A basic web crawler

This is a web crawler using React Native, Google App Engine, and Parse Cloud functions.

On the frontend app, the user may sign in and select a url to visit. A small amount of UI manipulation can be done by the bot. 
The HTML response is then saved to Back4App to be viewed later by the user. The actual web crawling is done on the backend in the google app engine.

The original idea for this web crawler was to create an app which could automate the process of visiting sites and performing SQL injection attacks on them. 
As it this, this app is nearly there. It just needs to be able to capture images.
