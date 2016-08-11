<?php
	mb_internal_encoding("UTF-8"); 

	$temp=$argv[1];

	$mes[0]="--";
	$mes[1]="1";
	$mes[2]="2";
	$mes[3]="3";
	$mes[4]="4";
	$mes[5]="5";
	$mes[6]="6";
	$mes[7]="7";
	$mes[8]="8";
	$mes[9]="9";
	$mes[10]="10";
	$mes[11]="11";
	$mes[12]="12";

	$dan[0]="nedeljo";
	$dan[1]="ponedeljek";
	$dan[2]="torek";
	$dan[3]="sredo";
	$dan[4]="četrtek";
	$dan[5]="petek";
	$dan[6]="soboto";

	$danf=(int)date("w");

	$mesf=(int)date("m");
	$besedilo = "\n\nV ". $dan[$danf].", ".date("d").". ".$mes[$mesf].". ".date("Y")." ". "ob ". date("H").":".date("i") . " je bila v server sobi Pivke Perutninarstvo d.d. prekoračena dovoljena temperatura.\n\n". 
	"Znasala je "  . $temp ." stopinj celzija.\n";

	$sms = new sms($argv[2],$argv[3]);

	$nizTelStevilk = $argv[4]; 
	$tabelaTelStevilk = split("\.", $nizTelStevilk);
	
	for( $i = 0; $i<sizeof($tabelaTelStevilk); $i++ ) {
	   $sms->send($tabelaTelStevilk[$i],$besedilo);
	   echo "Sporocilo uspešno poslano na številko $tabelaTelStevilk[$i].";
         }
	
	


class sms {
	
	public $username;
	public $pass;

	public $cookie_jar = '/tmp/sms.cookie';

	private $error = '';

	function __construct($u = null, $p = null) {
		if(!is_null($u)) {
			$this->username = $u;
		}

		if(!is_null($p)) {
			$this->pass = $p;
		}
	}


	public function send($number,$message) {
		$this->login();

		$message = substr(iconv('UTF-8', 'UTF-8', $message), 0, 160);
		$number = ltrim(preg_replace('/[^\d]/','',$number),'0');

		@list($area,$num1,$num2) = explode(' ',preg_replace('/(\d{2})(\d{3})(\d{3})/','\1 \2 \3',$number));

        $smsurl = "http://www.najdi.si/najdi/sms";
        $html = $this->req($smsurl);
        preg_match_all("#<input([^>]+)>#is", $html, $m);

        $url = 'http://www.najdi.si/najdi.shortcutplaceholder.freesmsshortcut.smsform';

        $post = array();
        $formdata = array('','','','','');
        foreach($m[1] as $input) {
            preg_match('#name="([^"]+)"#is', $input, $n);
            preg_match('#value="([^"]+)"#is', $input, $v);
            if($n[1] != 't:formdata') {
                $post[$n[1]] = isset($v[1]) ? $v[1] : '';
            } else {
                $formdata[] = isset($v[1]) ? $v[1] : '';
            }
        }

        $post = array_merge($post, array(
            't:submit'             =>  '["send","send"]',
            'text'                 =>  $message,
            't:zoneid'             =>  'smsZone',
            'areaCodeRecipient'    =>  "0$area",
            'phoneNumberRecipient' =>  "{$num1}{$num2}",
            'selectLru'            =>  '',
        ));

        unset($post['submit_0']);
        unset($post['najdiQSimple']);
        unset($post['cancel_0']);
        unset($post['saveLrus']);
        unset($post['send']);

        $post = http_build_query($post);
        foreach(array_reverse($formdata) as $f) {
            $f = urlencode($f);
            $ff = urlencode('t:formdata');
            $post .= "&$ff=$f";
        }

        return json_decode($this->req($url,$post,$smsurl, array('X-Requested-With: XMLHttpRequest')));
	}

	/*
	* Returns last error as stdclass
	*/
	public function get_error() {
		return $this->error;
	}

	private function login() {
		$html = $this->req('http://www.najdi.si/prijava');

        preg_match('#<input value="([^"]+)" name="t:formdata" type="hidden"/>#is',$html,$m);

        if(!preg_match('/Prijavljeni ste/is', $html)) {
            $this->req("http://www.najdi.si/prijava.jsecloginform", array(
                'jsecLogin'     	=> $this->username,
                'jsecPassword'  	=> $this->pass,
                'jsecRememberMe'	=> 'on',
                't:formdata'        => $m[1],
            ), 'http://www.najdi.si/prijava');
        }
	}

	function req($url, $post = false, $referer = false, $headers = array()) {
		$cookiejar = $this->cookie_jar;

		$loop = 20;
		do {
			$ack = curl_init();

			curl_setopt($ack, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36");
			curl_setopt($ack, CURLOPT_AUTOREFERER, true);
			curl_setopt($ack, CURLOPT_RETURNTRANSFER, true);
			//curl_setopt($ack, CURLOPT_HEADER, true);
			//curl_setopt($ack, CURLOPT_FOLLOWLOCATION, true);
			curl_setopt($ack, CURLOPT_URL, $url);
			curl_setopt($ack, CURLOPT_COOKIEFILE, $cookiejar);
			curl_setopt($ack, CURLOPT_COOKIEJAR, $cookiejar);
			curl_setopt($ack, CURLOPT_SSL_VERIFYPEER, false);

            if(!empty($headers)) {
                curl_setopt($ack, CURLOPT_HTTPHEADER, $headers);
            }


			if ($post) {
				curl_setopt($ack, CURLOPT_POST, 1);
				curl_setopt($ack, CURLOPT_POSTFIELDS, is_array($post) ? http_build_query($post) : $post);
			}

			if ($referer) {
				curl_setopt($ack, CURLOPT_REFERER, $referer);
			}

			$dat = curl_exec($ack);

            return $dat;

			$redirect = false;
			$http_code = curl_getinfo($ack, CURLINFO_HTTP_CODE);
			if ($http_code == 301 || $http_code == 302) {
				$matches = array();
				$post = false;
				$referer = $url;
				list($header) = explode("\n\n", $dat, 2);
				preg_match('/Location:(.*?)\n/', $header, $matches);
				$url = @parse_url(trim(array_pop($matches)));
				if (!$url) {
					$loop = 0;
					break;
				} else {
					$last_url = parse_url(curl_getinfo($ack, CURLINFO_EFFECTIVE_URL));

					if (!isset($url['scheme'])) {
						$url['scheme'] = $last_url['scheme'];
					}
					if (!isset($url['host'])) {
						$url['host'] = $last_url['host'];
					}
					if (!isset($url['path'])) {
						$url['path'] = $last_url['path'];
					}

					$new_url = $url['scheme'] . '://' . $url['host'] . $url['path'] . (isset($url['query']) ? '?' . $url['query'] : '');
					$url = $new_url;
					$redirect = true;
				}
			}

			curl_close($ack);
		} while($redirect && --$loop > 0);

		//echo $url. " ". substr($dat,0,500)."\n";

		if (!$dat) {
			return false;
		}

		$data = explode("\n\n",$dat);
		array_shift($data);

		return trim(implode("\n\n",$data));
	}

    static function dbg($msg) {
        if (php_sapi_name() == 'cli') {
            echo date('r')." $msg\n";
        }
    }

}

?>
