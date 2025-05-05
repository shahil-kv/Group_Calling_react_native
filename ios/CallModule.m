#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallModule, NSObject)

RCT_EXTERN_METHOD(makeCall:(NSString *)phoneNumber
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end 