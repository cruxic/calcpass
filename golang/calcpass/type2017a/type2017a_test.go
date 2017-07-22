package type2017a

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/cruxic/calcpass/golang/calcpass/util"
	"encoding/hex"
	"strings"
	"crypto/sha256"
)

func Test_isSaneEmail(t *testing.T) {
	assert := assert.New(t)

	assert.True(isSaneEmail("a@b.c"))
	assert.False(isSaneEmail("ab.c"))
	assert.False(isSaneEmail("a@bc"))
	assert.False(isSaneEmail(""))
	assert.False(isSaneEmail("a"))
	assert.False(isSaneEmail("ab.c"))
}

func Test_StretchMasterPassword(t *testing.T) {
	assert := assert.New(t)

	pass := []byte("Hello World")
	stretched, err := StretchMasterPassword(pass, "a@b.c")
	assert.Nil(err)
	assert.Equal(32, len(stretched))
	assert.Equal("f60f7cd075e3242879d04f3f10546f2cd5c2c1ab7790d466f9bca47864dfcce0", hex.EncodeToString(stretched))
	
}

func Test_VerifyStretchedMasterPassword(t *testing.T) {
	assert := assert.New(t)

	stretched := util.ByteSequence(1, 32)

	verf, err := CreateStretchedMasterVerifier(stretched)
	assert.Nil(err)

	same, err := VerifyStretchedMasterPassword(stretched, verf)
	assert.Nil(err)
	assert.True(same)

	//wrong password
	stretched[13]++
	same, err = VerifyStretchedMasterPassword(stretched, verf)
	assert.Nil(err)
	assert.False(same)

	//valid base64 but corrupt verifier
	same, err = VerifyStretchedMasterPassword(stretched, strings.ToLower(verf))
	assert.NotNil(err)
	assert.False(same)

	//invalid base64
	same, err = VerifyStretchedMasterPassword(stretched, "%@" + verf)
	assert.NotNil(err)
	assert.False(same)
}

func Test_MakeSiteKey(t *testing.T) {
	assert := assert.New(t)
	
	sm := util.ByteSequence(1, 32)
	stretchedMaster := StretchedMaster(sm)

	sitekey, err := MakeSiteKey(stretchedMaster, "example.com", 0)
	assert.Nil(err)

	assert.Equal("6c95536db40ee491011c5159a5990e39a5ff09dae396559fe7b2413c4308bc62",
		hex.EncodeToString([]byte(sitekey)))

	//case insensitive
	sitekey_again, err := MakeSiteKey(sm, "ExAmPle.CoM", 0)
	assert.Nil(err)
	assert.Equal([]byte(sitekey), []byte(sitekey_again))

	//white space trimmed
	sitekey_again, err = MakeSiteKey(sm, " \t\nexample.com \r\t", 0)
	assert.Nil(err)
	assert.Equal([]byte(sitekey), []byte(sitekey_again))

	//change revision
	sitekey, err = MakeSiteKey(stretchedMaster, "example.com", 1)
	assert.Nil(err)
	assert.Equal("86c1ff5a92135db9a0d16acf0a0821d5e2d84754c4a16c6934b804eeb2a3c57f",
		hex.EncodeToString([]byte(sitekey)))

	//change site
	sitekey, err = MakeSiteKey(stretchedMaster, "example.org", 0)
	assert.Nil(err)
	assert.Equal("319f040a68c164fcbc664729755a3a23088a5ae9daf987a4a9b636b23268afe2",
		hex.EncodeToString([]byte(sitekey)))

	//change master
	sm[31]++
	stretchedMaster = StretchedMaster(sm)
	sitekey, err = MakeSiteKey(stretchedMaster, "example.com", 0)
	assert.Nil(err)
	assert.Equal("6e2f595674027c50ff1f254fd851ed40bf8d161b93bf0474edd07798914896d9",
		hex.EncodeToString([]byte(sitekey)))	
	
}


func Test_MakeSiteCoordinates(t *testing.T) {
	assert := assert.New(t)

	tmp := util.ByteSequence(1, 32)
	sitekey := SiteKey(tmp)

	coords, err := MakeSiteCoordinates(sitekey, 2)
	assert.Nil(err)
	assert.Equal(2, len(coords))
	assert.Equal("1N", coords[0].String())
	assert.Equal("12H", coords[1].String())

	//change key
	tmp[31]++
	sitekey = SiteKey(tmp)
	coords, err = MakeSiteCoordinates(sitekey, 2)
	assert.Nil(err)
	assert.Equal(2, len(coords))
	assert.Equal("17H", coords[0].String())
	assert.Equal("5N", coords[1].String())

	
}

func Test_MixSiteAndCard(t *testing.T) {
	assert := assert.New(t)

	tmp := util.ByteSequence(1, 32)
	sitekey := SiteKey(tmp)

	mixed, err := MixSiteAndCard(sitekey, "qwertyui")
	assert.Nil(err)	
	assert.Equal("6e8c0b5448f31396a04b1139b0ec43308e55192340610a564107bfde8dccc8dc",
		hex.EncodeToString([]byte(mixed)))

	//white space trimmed and case insensitive
	mixed2, err := MixSiteAndCard(sitekey, " \n\tQwErTyUi \r\t")
	assert.Nil(err)	
	assert.Equal([]byte(mixed), []byte(mixed2))

	//change characters
	mixed, err = MixSiteAndCard(sitekey, "qwertyuj")
	assert.Nil(err)	
	assert.Equal("9c53f3e72f7fa10886bb649be768df342936c21f17ae0f0657b56116e5a7eb98",
		hex.EncodeToString([]byte(mixed)))
	
	//change key
	tmp[31]++
	sitekey = SiteKey(tmp)
	mixed, err = MixSiteAndCard(sitekey, "qwertyui")
	assert.Nil(err)	
	assert.Equal("9052e4f7b3e69fc27ccbeedbbf28b28625a7a30ec2a3c0c11c695f8808da6520",
		hex.EncodeToString([]byte(mixed)))
}
	
func Test_StretchSiteCardMix(t *testing.T) {
	assert := assert.New(t)

	tmp := util.ByteSequence(1, 32)
	mixed := SiteCardMix(tmp)

	pwseed := StretchSiteCardMix(mixed)
	assert.Equal("0fb2c41f1a71834186bc515889f881d892efcd248eabf88ff68abfa7afdc6df7",
		hex.EncodeToString([]byte(pwseed)))
}

func Test_MakeFriendlyPassword12a(t *testing.T) {
	assert := assert.New(t)

	tmp := util.ByteSequence(1, 32)
	pwseed := PasswordSeed(tmp)
	
	pw, err := MakeFriendlyPassword12a(pwseed)
	assert.Nil(err)
	assert.Equal("Scvqduejxmm5", pw)

	//change seed
	tmp[31]++
	pwseed = PasswordSeed(tmp)
	pw, err = MakeFriendlyPassword12a(pwseed)
	assert.Nil(err)
	assert.Equal("Ikvruuyldov1", pw)

	//
	// Verify that all characters are possible (a-z, 0-9)

	tmp = util.ByteSequence(1, 32)
	need := "abcdefghijklmnopqrstuvwxyz0123456789"
	charCounts := make(map[byte]int)
	sha := sha256.New()
	foundAll := false
	j := 0
	
	for !foundAll && j < 100 {
		//modify seed
		tmp[j % 32]++
		j++

		//create pass
		pass, err := MakeFriendlyPassword12a(PasswordSeed(tmp))
		assert.Nil(err)

		sha.Write([]byte(pass))
		pass = strings.ToLower(pass)

		//count characters used
		for i := range pass {
			charCounts[pass[i]]++
		}

		//found all needed characters?
		foundAll = true
		for i := range need {
			if charCounts[need[i]] == 0 {
				foundAll = false
				break
			}
		}
	}

	assert.True(foundAll)
	assert.Equal(20, j)

	//verify hash of all passwords
	assert.Equal("008634126acab8fdd6c34f123495a8d2d3ae9cd073e705cd12d506d71e63234a", hex.EncodeToString(sha.Sum(nil)))
	
}
