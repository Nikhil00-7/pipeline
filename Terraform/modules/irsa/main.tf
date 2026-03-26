resource "aws_iam_role" "alb_controller_role" {
  name = "AmazonEKSLoadBalancerControllerRole" 
  assume_role_policy = jsonencode({
    Version="2012-10-17"
    Statement =[
        {
            Effect = "Allow"
            Principal ={
                  Federated = var.oidc_provider_arn
            }
            Action = "sts:AssumeRoleWithIdentity"
            Condition ={
                 StringEquals = {
            "${var.oidc_url}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
            }
         }
        }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "alb_controller_role_policy_attachment" {
  role = aws_iam_role.alb_controller_role.name 
    policy_arn = "arn:aws:iam::aws:policy/AWSLoadBalancerControllerIAMPolicy"
}

resource "aws_route53_zone" "main" {
  name = "example.com"
}

resource "aws_iam_role" "external_dns_role" {
  name ="ExternalDNSRoute53Policy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement =[
        {
            Effect = "Allow"
            Principal = {
              Federated = var.oidc_provider_arn
           }
             Action = "sts:AssumeRoleWithIdentity"
              Condition = {
          StringEquals = {
            "${var.oidc_url}:sub" = "system:serviceaccount:kube-system:external-dns"
               }
            }
        }
    ]
  })
}

resource "aws_iam_policy" "external_dns_policy" {
  name = "ExternalDNSRoute53Policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets"
        ]
        Resource = [
          "arn:aws:route53:::hostedzone/${aws_route53_zone.main.zone_id}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets"
        ]
        Resource = ["*"]
      }
    ]
  })
  
}

resource "aws_iam_role_policy_attachment" "external_dns_attach" {

  role= aws_iam_role.external_dns_role.name

  policy_arn = aws_iam_policy.external_dns_policy.arn
}
