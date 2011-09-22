#
# Makefile for Palm WebOS Enyo
#
#

PACKAGE = cx.ath.kjhenrie.kindleimport
DEVICE = tcp

.PHONY: web

web:
	chromium-browser --disable-web-security --allow-file-access-from-files src/applications/cx.ath.kjhenrie.kindleimport.app/index.html &> /dev/null &
	
help:
	chromium-browser --disable-web-security --allow-file-access-from-files /opt/PalmSDK/Current/share/refcode/framework/enyo/1.0/support/docs/api/index.html &> /dev/null &
	
examples:
	nautilus /opt/PalmSDK/Current/share/refcode/framework/enyo/1.0/support/
	
%.ipk:
	
	rm -rf *.ipk
	./ipkg-build.sh ./

package: %.ipk

usb: DEVICE = usb
usb: install

clean:
	rm -rf *.ipk
	- palm-install -d $(DEVICE) -r $(PACKAGE)

install: package
	palm-install -d $(DEVICE) *.ipk
	
launch:
	palm-launch -d $(DEVICE) $(PACKAGE)
	
log: launch
	palm-log -d $(DEVICE) -f $(PACKAGE)
