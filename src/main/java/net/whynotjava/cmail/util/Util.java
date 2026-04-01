package net.whynotjava.cmail.util;

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
}
