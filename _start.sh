docker build -t node .
docker container rm -f kik_automation
docker run -dit --shm-size=1gb --name kik_automation --restart always -v //c/Dropbox/SimpleSoftwareStudioShare/Node_KikAutomation/:/app node
