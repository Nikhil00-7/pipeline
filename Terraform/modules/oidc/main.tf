data "tls_certificate" "oidc_thumbprint" {
 url =var.oidc_url 
}

resource "aws_iam_openid_connect_provider" "oidc" {
  url = var.oidc_url 
  client_id_list =[
  "sts.amazonaws.com"
  ]
  thumbprint_list = [

 data.tls_certificate.oidc_thumbprint.certificates[0].sha1_fingerprint
  ]
  
}