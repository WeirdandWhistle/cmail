package net.whynotjava.cmail.util;

import org.springframework.http.*;

public abstract class Util {
    private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();
    public static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);
    }
    public static String bytesToChars(byte bytes[]){
        char chars[] = new char[bytes.length];
        for(int i=0;i<bytes.length;i++){
            chars[i]=(char)bytes[i];
        }
        return new String(chars);
    }
    public static String generateJsonError(String error, String error_message){
        return "{\"ok\":false,\"error\":\""+error+"\",\"error_message\":\""+error_message+"\"}";
    }
    public static String generateJsonError(String error){
        return generateJsonError(error,"");
    }
    public static ResponseEntity<String> generateJsonErrorRes(String error, String error_message, HttpStatus stat){
        return new ResponseEntity<>(generateJsonError(error, error_message),stat);
    }
     public static ResponseEntity<String> generateJsonErrorRes(String error, String error_message){
        return new ResponseEntity<>(generateJsonError(error, error_message),HttpStatus.INTERNAL_SERVER_ERROR);
    } public static ResponseEntity<String> generateJsonErrorRes(String error){
        return new ResponseEntity<>(generateJsonError(error),HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
