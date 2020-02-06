#!/bin/bash

function patch_rzslider()
{
	echo "Patching 'node_modules/angularjs-slider/dist/rzslider.css'..."
	sed -i "s/#0db9f0/#208B69/g" node_modules/angularjs-slider/dist/rzslider.css
}

function patch_bootstrap()
{
	echo "Patching 'node_modules/bootstrap/dist/css/bootstrap.css'..."
	sed -i "s/\  color: #23527c;/  color: #222222;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  color: #286090;/  color: #222222;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  color: #337ab7;/  color: #333333;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  color: #337ab7;/  color: #333333;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  border-color: #2e6da4;/  border-color: #53B193;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  background-color: #337ab7;/  background-color: #208B69;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  border-color: #204d74;/  border-color: #208B69;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  background-color: #286090;/  background-color: #53B193;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  border-color: #204d74;/  border-color: #208B69;/g" node_modules/bootstrap/dist/css/bootstrap.css
	sed -i "s/\  background-color: #204d74;/  background-color: #208B69;/g" node_modules/bootstrap/dist/css/bootstrap.css
}

function patch_bootstrap_theme()
{
	echo "Patching 'node_modules/bootstrap/dist/css/bootstrap.css'..."
	sed -i "s/\  background-image: -webkit-linear-gradient(top, #337ab7 0%, #2e6da4 100%);/  background-image: -webkit-linear-gradient(top, #53B193 0%, #208B69 100%);/g" node_modules/bootstrap/dist/css/bootstrap-theme.css
	sed -i "s/\  background-image: -o-linear-gradient(top, #337ab7 0%, #2e6da4 100%);/  background-image: -o-linear-gradient(top, #53B193 0%, #208B69 100%);/g" node_modules/bootstrap/dist/css/bootstrap-theme.css
	sed -i "s/\  background-image: -webkit-gradient(linear, left top, left bottom, from(#337ab7), to(#2e6da4));/  background-image: -webkit-gradient(linear, left top, left bottom, from(#337ab7), to(#208B69));/g" node_modules/bootstrap/dist/css/bootstrap-theme.css
	sed -i "s/\  background-image: linear-gradient(to bottom, #337ab7 0%, #2e6da4 100%);/  background-image: linear-gradient(to bottom, #53B193 0%, #208B69 100%);/g" node_modules/bootstrap/dist/css/bootstrap-theme.css
	sed -i "s/\  background-color: #2e6da4;/  background-color: #208B69;/g" node_modules/bootstrap/dist/css/bootstrap-theme.css
}

function patch_rdash()
{
	echo "Patching 'node_modules/rdash-ui/dist/css/rdash.css'..."
	sed -i "s/\  background: #30426a;/  background: #208B69;/g" node_modules/rdash-ui/dist/css/rdash.css
	sed -i "s/\  background: #2d3e63;/  background: #53B193;/g" node_modules/rdash-ui/dist/css/rdash.css
	sed -i "s/\  color: #738bc0;/  color: #FFFFFF;/g" node_modules/rdash-ui/dist/css/rdash.css
	sed -i "s/\  color: #b2bfdc;/  color: #FFFFFF;/g" node_modules/rdash-ui/dist/css/rdash.css
	sed -i "s/\  border-left: 3px solid #FFA509;/  border-left: 3px solid #e99d1a;/g" node_modules/rdash-ui/dist/css/rdash.css
	sed -i "s/\  color: #b2bfdc;/  color: #FFFFFF;/g" node_modules/rdash-ui/dist/css/rdash.css
}

function patch_css()
{
	patch_rzslider
	patch_bootstrap
	patch_bootstrap_theme
	patch_rdash
}

function main()
{
	git checkout -b portainer-develop develop
	git pull git://github.com/portainer/portainer.git develop

	git checkout develop
	git merge --no-ff portainer-develop
	#git push origin develop

	docker rmi -f portainer/base:latest
	docker load portainer_base.tar

	yarn
	yarn build

	patch_css
}

main
