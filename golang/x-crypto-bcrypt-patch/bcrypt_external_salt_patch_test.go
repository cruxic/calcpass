package bcrypt

import "testing"

func doTest(password, saltB64, expect string, t *testing.T) {
	pass := []byte(password)
	salt, err := base64Decode([]byte(saltB64))
	if err != nil || len(salt) != 16 {
		t.Error("unable to decode salt", err)
		return
	}
	
	res, err := GenerateFromPasswordAndSalt(pass, salt, 5);
	if err != nil {
		t.Error(err)
		return
	}
	
	resStr := string(res)
	if resStr != expect {
		t.Errorf("wrong result: %s  (expected %s)", resStr, expect)
		return
	}
}

func TestGenerateFromPasswordAndSalt(t *testing.T) {

	//The following test vectors are from john the ripper:
	//http://cvsweb.openwall.com/cgi/cvsweb.cgi/Owl/packages/john/john/src/BF_fmt.c?rev=HEAD
	
	doTest("U*U*U", "XXXXXXXXXXXXXXXXXXXXXO", "$2a$05$XXXXXXXXXXXXXXXXXXXXXOAcXxm9kjPGEMsLznoKqmqw7tc8WCx4a", t)
	
	veryLong := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789chars after 72 are ignored"
	doTest(veryLong, "abcdefghijklmnopqrstuu", "$2a$05$abcdefghijklmnopqrstuu5s2v8.iXieOjg/.AySBTTZIIVFJeBui", t)
}
