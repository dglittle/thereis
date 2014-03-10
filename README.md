thereis
=======

UNDER CONSTRUCTION

commands to set it up on heroku:

```
heroku apps:create thereis
heroku addons:add mongohq:sandbox
heroku labs:enable websockets

heroku config:set SESSION_SECRET=change_me

git push heroku master
```
